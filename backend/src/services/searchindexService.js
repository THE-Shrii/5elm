const { indexProduct, deleteFromIndex } = require('../config/elasticsearch');
const Product = require('../models/Product');

// Sync all products to Elasticsearch
const syncAllProducts = async () => {
  try {
    console.log('🔄 Starting product index sync...');
    
    const products = await Product.find({
      status: 'active',
      visibility: 'public'
    }).populate('category');

    let indexed = 0;
    let errors = 0;

    for (const product of products) {
      try {
        await indexProduct(product);
        indexed++;
        
        if (indexed % 10 === 0) {
          console.log(`📈 Indexed ${indexed}/${products.length} products`);
        }
      } catch (error) {
        console.error(`Error indexing product ${product._id}:`, error.message);
        errors++;
      }
    }

    console.log(`✅ Product sync complete: ${indexed} indexed, ${errors} errors`);
    return { indexed, errors, total: products.length };

  } catch (error) {
    console.error('❌ Product sync failed:', error);
    throw error;
  }
};

// Sync single product
const syncProduct = async (productId) => {
  try {
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status === 'active' && product.visibility === 'public') {
      await indexProduct(product);
      console.log(`✅ Product ${product.name} indexed successfully`);
    } else {
      await deleteFromIndex(productId);
      console.log(`✅ Product ${product.name} removed from index`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error syncing product ${productId}:`, error.message);
    throw error;
  }
};

// Remove product from index
const removeProduct = async (productId) => {
  try {
    await deleteFromIndex(productId);
    console.log(`✅ Product ${productId} removed from search index`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing product ${productId}:`, error.message);
    throw error;
  }
};

module.exports = {
  syncAllProducts,
  syncProduct,
  removeProduct
};
