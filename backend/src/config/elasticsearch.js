const { Client } = require('@elastic/elasticsearch');

// Create Elasticsearch client
const createElasticsearchClient = () => {
  // For development, we'll use a simple configuration
  // In production, you'd connect to an actual Elasticsearch cluster
  const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
      password: process.env.ELASTICSEARCH_PASSWORD || 'password'
    },
    // For development without actual Elasticsearch
    requestTimeout: 30000,
    pingTimeout: 3000,
    maxRetries: 3
  });

  return client;
};

// Initialize client
let esClient;
try {
  esClient = createElasticsearchClient();
} catch (error) {
  console.log('⚠️  Elasticsearch not available, using fallback search');
  esClient = null;
}

// Index names
const INDICES = {
  PRODUCTS: '5elm_products',
  SEARCHES: '5elm_searches',
  ANALYTICS: '5elm_analytics'
};

// Product mapping for Elasticsearch
const PRODUCT_MAPPING = {
  mappings: {
    properties: {
      name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple'
          }
        }
      },
      description: {
        type: 'text',
        analyzer: 'standard'
      },
      brand: {
        type: 'keyword',
        fields: {
          text: { type: 'text' }
        }
      },
      category: {
        type: 'nested',
        properties: {
          id: { type: 'keyword' },
          name: { type: 'keyword' },
          slug: { type: 'keyword' }
        }
      },
      price: { type: 'float' },
      originalPrice: { type: 'float' },
      discountPercentage: { type: 'float' },
      rating: {
        type: 'nested',
        properties: {
          averageRating: { type: 'float' },
          totalReviews: { type: 'integer' }
        }
      },
      tags: { type: 'keyword' },
      status: { type: 'keyword' },
      visibility: { type: 'keyword' },
      inventory: {
        type: 'nested',
        properties: {
          stock: { type: 'integer' },
          sku: { type: 'keyword' }
        }
      },
      images: {
        type: 'nested',
        properties: {
          url: { type: 'keyword' },
          alt: { type: 'text' }
        }
      },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' }
    }
  }
};

// Initialize Elasticsearch indices
const initializeIndices = async () => {
  if (!esClient) {
    console.log('ℹ️  Skipping Elasticsearch initialization (not available)');
    return false;
  }

  try {
    // Check if Elasticsearch is available
    await esClient.ping();
    console.log('✅ Elasticsearch connected successfully');

    // Create products index if it doesn't exist
    const productIndexExists = await esClient.indices.exists({
      index: INDICES.PRODUCTS
    });

    if (!productIndexExists) {
      await esClient.indices.create({
        index: INDICES.PRODUCTS,
        body: PRODUCT_MAPPING
      });
      console.log(`✅ Created index: ${INDICES.PRODUCTS}`);
    }

    // Create searches index for analytics
    const searchIndexExists = await esClient.indices.exists({
      index: INDICES.SEARCHES
    });

    if (!searchIndexExists) {
      await esClient.indices.create({
        index: INDICES.SEARCHES,
        body: {
          mappings: {
            properties: {
              query: { type: 'keyword' },
              results: { type: 'integer' },
              userId: { type: 'keyword' },
              timestamp: { type: 'date' },
              filters: { type: 'object' }
            }
          }
        }
      });
      console.log(`✅ Created index: ${INDICES.SEARCHES}`);
    }

    return true;
  } catch (error) {
    console.log('⚠️  Elasticsearch initialization failed:', error.message);
    return false;
  }
};

// Index a product
const indexProduct = async (product) => {
  if (!esClient) return false;

  try {
    const doc = {
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category ? {
        id: product.category._id,
        name: product.category.name,
        slug: product.category.slug
      } : null,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercentage: product.discountPercentage,
      rating: {
        averageRating: product.reviews?.averageRating || 0,
        totalReviews: product.reviews?.totalReviews || 0
      },
      tags: product.tags || [],
      status: product.status,
      visibility: product.visibility,
      inventory: {
        stock: product.inventory?.stock || 0,
        sku: product.inventory?.sku
      },
      images: product.images || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    await esClient.index({
      index: INDICES.PRODUCTS,
      id: product._id.toString(),
      body: doc
    });

    return true;
  } catch (error) {
    console.error('Error indexing product:', error);
    return false;
  }
};

// Delete product from index
const deleteFromIndex = async (productId) => {
  if (!esClient) return false;

  try {
    await esClient.delete({
      index: INDICES.PRODUCTS,
      id: productId.toString()
    });
    return true;
  } catch (error) {
    console.error('Error deleting from index:', error);
    return false;
  }
};

// Log search analytics
const logSearch = async (query, results, userId = null, filters = {}) => {
  if (!esClient) return false;

  try {
    await esClient.index({
      index: INDICES.SEARCHES,
      body: {
        query: query.toLowerCase(),
        results: results,
        userId: userId,
        timestamp: new Date(),
        filters: filters
      }
    });
    return true;
  } catch (error) {
    console.error('Error logging search:', error);
    return false;
  }
};

module.exports = {
  esClient,
  INDICES,
  initializeIndices,
  indexProduct,
  deleteFromIndex,
  logSearch
};
