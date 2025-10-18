const Product = require('../models/Product');
const { esClient, INDICES, logSearch } = require('../config/elasticsearch');
const Fuse = require('fuse.js');

// @desc    Enhanced Ayurvedic product search with comprehensive filtering
// @route   GET /api/v1/search/products
// @access  Public
const searchProducts = async (req, res, next) => {
  try {
    const {
      q: query = '',
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      tags,
      // Ayurvedic-specific filters
      dosha,
      skinType,
      conditions,
      ingredients,
      certifications,
      timeOfDay,
      // Standard filters
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      inStock = true
    } = req.query;

    let results;
    let total;

    // Try Elasticsearch first
    if (esClient) {
      try {
        const searchResult = await elasticsearchSearch({
          query,
          category,
          brand,
          minPrice,
          maxPrice,
          minRating,
          tags,
          dosha,
          skinType,
          conditions,
          ingredients,
          certifications,
          timeOfDay,
          sortBy,
          sortOrder,
          page: parseInt(page),
          limit: parseInt(limit),
          inStock: inStock === 'true'
        });

        results = searchResult.products;
        total = searchResult.total;

        // Log search analytics
        await logSearch(query || '*', total, req.user?.id, {
          category,
          brand,
          minPrice,
          maxPrice,
          minRating,
          tags,
          dosha,
          skinType,
          conditions,
          ingredients,
          certifications,
          sortBy
        });

      } catch (esError) {
        console.log('Elasticsearch search failed, falling back to MongoDB:', esError.message);
        // Fallback to MongoDB search
        const mongoResult = await mongodbAyurvedicSearch({
          query,
          category,
          brand,
          minPrice,
          maxPrice,
          minRating,
          tags,
          dosha,
          skinType,
          conditions,
          ingredients,
          certifications,
          timeOfDay,
          sortBy,
          sortOrder,
          page: parseInt(page),
          limit: parseInt(limit),
          inStock: inStock === 'true'
        });

        results = mongoResult.products;
        total = mongoResult.total;
      }
    } else {
      // Use MongoDB search
      const mongoResult = await mongodbAyurvedicSearch({
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        tags,
        dosha,
        skinType,
        conditions,
        ingredients,
        certifications,
        timeOfDay,
        sortBy,
        sortOrder,
        page: parseInt(page),
        limit: parseInt(limit),
        inStock: inStock === 'true'
      });

      results = mongoResult.products;
      total = mongoResult.total;
    }

    // Calculate pagination
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        query: query || null,
        category: category || null,
        brand: brand || null,
        priceRange: {
          min: minPrice ? parseFloat(minPrice) : null,
          max: maxPrice ? parseFloat(maxPrice) : null
        },
        minRating: minRating ? parseFloat(minRating) : null,
        tags: tags ? tags.split(',') : null,
        // Ayurvedic-specific filters
        dosha: dosha || null,
        skinType: skinType || null,
        conditions: conditions ? conditions.split(',') : null,
        ingredients: ingredients ? ingredients.split(',') : null,
        certifications: certifications ? certifications.split(',') : null,
        timeOfDay: timeOfDay || null,
        inStock: inStock === 'true'
      },
      sortBy,
      sortOrder,
      data: results
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get search suggestions/autocomplete
// @route   GET /api/v1/search/suggestions
// @access  Public
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    let suggestions = [];

    // Try Elasticsearch suggestions first
    if (esClient) {
      try {
        const esResponse = await esClient.search({
          index: INDICES.PRODUCTS,
          body: {
            suggest: {
              product_suggest: {
                text: query,
                completion: {
                  field: 'name.suggest',
                  size: parseInt(limit)
                }
              }
            }
          }
        });

        suggestions = esResponse.body.suggest.product_suggest[0].options.map(option => ({
          text: option.text,
          score: option._score
        }));

      } catch (esError) {
        console.log('Elasticsearch suggestions failed, using fallback');
        // Fallback to MongoDB regex search
        suggestions = await getMongoSuggestions(query, parseInt(limit));
      }
    } else {
      // Use MongoDB for suggestions
      suggestions = await getMongoSuggestions(query, parseInt(limit));
    }

    res.status(200).json({
      success: true,
      query,
      count: suggestions.length,
      data: suggestions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get search filters/facets for Ayurvedic products
// @route   GET /api/v1/search/filters
// @access  Public
const getSearchFilters = async (req, res, next) => {
  try {
    const { q: query } = req.query;

    // Get available filter options with Ayurvedic fields
    const filters = await Product.aggregate([
      // Match only active, visible products
      {
        $match: {
          status: 'active',
          visibility: 'public',
          ...(query && {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { brand: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } },
              { 'ayurvedic.ingredients.name': { $regex: query, $options: 'i' } },
              { 'ayurvedic.conditions': { $in: [new RegExp(query, 'i')] } },
              { 'ayurvedic.benefits': { $in: [new RegExp(query, 'i')] } }
            ]
          })
        }
      },
      // Group and collect filter options
      {
        $facet: {
          categories: [
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
            { $unwind: '$categoryInfo' },
            { $group: { _id: '$categoryInfo._id', name: { $first: '$categoryInfo.name' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          brands: [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } }
          ],
          priceRanges: [
            {
              $bucket: {
                groupBy: '$price',
                boundaries: [0, 500, 1000, 2000, 5000, 10000, 25000],
                default: 'Other',
                output: { count: { $sum: 1 } }
              }
            }
          ],
          ratings: [
            {
              $bucket: {
                groupBy: '$ratings.average',
                boundaries: [0, 1, 2, 3, 4, 5],
                default: 'Unrated',
                output: { count: { $sum: 1 } }
              }
            }
          ],
          tags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          // Ayurvedic-specific filters
          doshas: [
            { $unwind: '$ayurvedic.doshas' },
            { $group: { _id: '$ayurvedic.doshas', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          skinTypes: [
            { $unwind: '$ayurvedic.skinTypes' },
            { $group: { _id: '$ayurvedic.skinTypes', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          conditions: [
            { $unwind: '$ayurvedic.conditions' },
            { $group: { _id: '$ayurvedic.conditions', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 }
          ],
          ingredients: [
            { $unwind: '$ayurvedic.ingredients' },
            { $group: { _id: '$ayurvedic.ingredients.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          certifications: [
            { $unwind: '$ayurvedic.certifications' },
            { $group: { _id: '$ayurvedic.certifications', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          timeOfDay: [
            { $unwind: '$ayurvedic.usage.timeOfDay' },
            { $group: { _id: '$ayurvedic.usage.timeOfDay', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);

    const facets = filters[0];

    res.status(200).json({
      success: true,
      data: {
        categories: facets.categories,
        brands: facets.brands,
        priceRanges: facets.priceRanges.map(range => ({
          range: range._id === 'Other' ? '25000+' : `${range._id}`,
          count: range.count
        })),
        ratings: facets.ratings.map(rating => ({
          rating: rating._id === 'Unrated' ? 0 : rating._id,
          count: rating.count
        })),
        tags: facets.tags,
        // Ayurvedic-specific facets
        doshas: facets.doshas,
        skinTypes: facets.skinTypes,
        conditions: facets.conditions,
        ingredients: facets.ingredients,
        certifications: facets.certifications,
        timeOfDay: facets.timeOfDay,
        totalProducts: await Product.countDocuments({ status: 'active', visibility: 'public' })
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get search analytics (Admin only)
// @route   GET /api/v1/search/analytics
// @access  Private/Admin
const getSearchAnalytics = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter;
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // If Elasticsearch is available, use it for analytics
    if (esClient) {
      try {
        const analytics = await esClient.search({
          index: INDICES.SEARCHES,
          body: {
            query: {
              range: {
                timestamp: {
                  gte: dateFilter.toISOString()
                }
              }
            },
            aggs: {
              popular_searches: {
                terms: {
                  field: 'query',
                  size: 20
                }
              },
              searches_over_time: {
                date_histogram: {
                  field: 'timestamp',
                  calendar_interval: '1d'
                }
              },
              zero_result_searches: {
                filter: {
                  term: { results: 0 }
                },
                aggs: {
                  queries: {
                    terms: {
                      field: 'query',
                      size: 10
                    }
                  }
                }
              }
            }
          }
        });

        const esData = analytics.body;

        res.status(200).json({
          success: true,
          period,
          data: {
            totalSearches: esData.hits.total.value,
            popularSearches: esData.aggregations.popular_searches.buckets,
            searchesOverTime: esData.aggregations.searches_over_time.buckets,
            zeroResultSearches: esData.aggregations.zero_result_searches.queries.buckets
          }
        });

        return;
      } catch (esError) {
        console.log('Elasticsearch analytics failed, using fallback');
      }
    }

    // Fallback analytics (simplified)
    res.status(200).json({
      success: true,
      period,
      data: {
        totalSearches: 0,
        popularSearches: [],
        searchesOverTime: [],
        zeroResultSearches: [],
        message: 'Analytics available when Elasticsearch is configured'
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function for Enhanced Elasticsearch search with Ayurvedic fields
const elasticsearchSearch = async (params) => {
  const {
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    tags,
    dosha,
    skinType,
    conditions,
    ingredients,
    certifications,
    timeOfDay,
    sortBy,
    page,
    limit,
    inStock
  } = params;

  const must = [];
  const filter = [];

  // Enhanced text search including Ayurvedic fields
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: [
          'name^3', 
          'description^2', 
          'brand^2', 
          'tags',
          'ayurvedic.ingredients.name^2',
          'ayurvedic.conditions^1.5',
          'ayurvedic.benefits^1.5'
        ],
        type: 'best_fields',
        fuzziness: 'AUTO',
        operator: 'or'
      }
    });
  }

  // Standard filters
  filter.push({ term: { status: 'active' } });
  filter.push({ term: { visibility: 'public' } });

  if (category) {
    filter.push({ term: { 'category.id': category } });
  }

  if (brand) {
    filter.push({ term: { brand } });
  }

  if (minPrice || maxPrice) {
    const priceRange = {};
    if (minPrice) priceRange.gte = parseFloat(minPrice);
    if (maxPrice) priceRange.lte = parseFloat(maxPrice);
    filter.push({ range: { price: priceRange } });
  }

  if (minRating) {
    filter.push({ range: { 'ratings.average': { gte: parseFloat(minRating) } } });
  }

  if (tags) {
    const tagArray = tags.split(',');
    filter.push({ terms: { tags: tagArray } });
  }

  if (inStock) {
    filter.push({ range: { 'inventory.stock': { gt: 0 } } });
  }

  // Ayurvedic-specific filters
  if (dosha) {
    const doshaArray = dosha.split(',');
    filter.push({ terms: { 'ayurvedic.doshas': doshaArray } });
  }

  if (skinType) {
    const skinTypeArray = skinType.split(',');
    filter.push({ terms: { 'ayurvedic.skinTypes': skinTypeArray } });
  }

  if (conditions) {
    const conditionsArray = conditions.split(',');
    filter.push({ terms: { 'ayurvedic.conditions': conditionsArray } });
  }

  if (ingredients) {
    const ingredientsArray = ingredients.split(',');
    filter.push({ terms: { 'ayurvedic.ingredients.name': ingredientsArray } });
  }

  if (certifications) {
    const certificationsArray = certifications.split(',');
    filter.push({ terms: { 'ayurvedic.certifications': certificationsArray } });
  }

  if (timeOfDay) {
    const timeArray = timeOfDay.split(',');
    filter.push({ terms: { 'ayurvedic.usage.timeOfDay': timeArray } });
  }

  // Enhanced sorting
  let sort = [];
  switch (sortBy) {
    case 'price_asc':
      sort.push({ price: { order: 'asc' } });
      break;
    case 'price_desc':
      sort.push({ price: { order: 'desc' } });
      break;
    case 'rating':
      sort.push({ 'ratings.average': { order: 'desc' } });
      sort.push({ 'ratings.count': { order: 'desc' } });
      break;
    case 'newest':
      sort.push({ createdAt: { order: 'desc' } });
      break;
    case 'popularity':
      sort.push({ 'analytics.purchases': { order: 'desc' } });
      sort.push({ 'analytics.views': { order: 'desc' } });
      break;
    case 'trending':
      sort.push({ 'analytics.trending': { order: 'desc' } });
      sort.push({ 'analytics.views': { order: 'desc' } });
      break;
    case 'relevance':
    default:
      if (query) {
        sort.push({ _score: { order: 'desc' } });
      } else {
        sort.push({ createdAt: { order: 'desc' } });
      }
      break;
  }

  const searchBody = {
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter: filter
      }
    },
    sort: sort,
    from: (page - 1) * limit,
    size: limit,
    // Add highlighting for better search results
    highlight: {
      fields: {
        name: {},
        description: {},
        'ayurvedic.ingredients.name': {},
        'ayurvedic.conditions': {},
        'ayurvedic.benefits': {}
      }
    }
  };

  const response = await esClient.search({
    index: INDICES.PRODUCTS,
    body: searchBody
  });

  const products = response.body.hits.hits.map(hit => ({
    _id: hit._id,
    ...hit._source,
    _score: hit._score,
    _highlights: hit.highlight || {}
  }));

  return {
    products,
    total: response.body.hits.total.value
  };
};

// Helper function for Enhanced MongoDB search with Ayurvedic fields
const mongodbAyurvedicSearch = async (params) => {
  const {
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    tags,
    dosha,
    skinType,
    conditions,
    ingredients,
    certifications,
    timeOfDay,
    sortBy,
    page,
    limit,
    inStock
  } = params;

  const filter = {
    status: 'active',
    visibility: 'public'
  };

  // Text search across multiple fields including Ayurvedic fields
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      // Ayurvedic-specific search fields
      { 'ayurvedic.ingredients.name': { $regex: query, $options: 'i' } },
      { 'ayurvedic.conditions': { $in: [new RegExp(query, 'i')] } },
      { 'ayurvedic.benefits': { $in: [new RegExp(query, 'i')] } }
    ];
  }

  // Standard filters
  if (category) filter.category = category;
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (minRating) {
    filter['ratings.average'] = { $gte: parseFloat(minRating) };
  }
  if (tags) {
    filter.tags = { $in: tags.split(',') };
  }
  if (inStock) {
    filter['inventory.stock'] = { $gt: 0 };
  }

  // Ayurvedic-specific filters
  if (dosha) {
    filter['ayurvedic.doshas'] = { $in: dosha.split(',') };
  }
  if (skinType) {
    filter['ayurvedic.skinTypes'] = { $in: skinType.split(',') };
  }
  if (conditions) {
    filter['ayurvedic.conditions'] = { $in: conditions.split(',') };
  }
  if (ingredients) {
    filter['ayurvedic.ingredients.name'] = { $in: ingredients.split(',').map(ing => new RegExp(ing, 'i')) };
  }
  if (certifications) {
    filter['ayurvedic.certifications'] = { $in: certifications.split(',') };
  }
  if (timeOfDay) {
    filter['ayurvedic.usage.timeOfDay'] = { $in: timeOfDay.split(',') };
  }

  // Enhanced sorting with relevance scoring
  let sort = {};
  switch (sortBy) {
    case 'price_asc':
      sort.price = 1;
      break;
    case 'price_desc':
      sort.price = -1;
      break;
    case 'rating':
      sort['ratings.average'] = -1;
      sort['ratings.count'] = -1;
      break;
    case 'newest':
      sort.createdAt = -1;
      break;
    case 'popularity':
      sort['analytics.purchases'] = -1;
      sort['analytics.views'] = -1;
      break;
    case 'trending':
      sort['analytics.trending'] = -1;
      sort['analytics.views'] = -1;
      break;
    case 'relevance':
    default:
      if (query) {
        // For text search, use MongoDB text score
        sort = { score: { $meta: 'textScore' } };
      } else {
        // Fallback to latest products when no search query
        sort.createdAt = -1;
      }
      break;
  }

  const skip = (page - 1) * limit;

  let products;
  
  // Use text search when query is provided for better relevance
  if (query && sortBy === 'relevance') {
    products = await Product.find({
      ...filter,
      $text: { $search: query }
    }, {
      score: { $meta: 'textScore' }
    })
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  } else {
    products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  const total = await Product.countDocuments(filter);

  return { products, total };
};

// Helper function for MongoDB suggestions with Ayurvedic fields
const getMongoSuggestions = async (query, limit) => {
  const products = await Product.find({
    status: 'active',
    visibility: 'public',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      // Ayurvedic-specific suggestions
      { 'ayurvedic.ingredients.name': { $regex: query, $options: 'i' } },
      { 'ayurvedic.conditions': { $in: [new RegExp(query, 'i')] } },
      { 'ayurvedic.benefits': { $in: [new RegExp(query, 'i')] } }
    ]
  })
  .select('name brand ayurvedic.ingredients.name ayurvedic.conditions ayurvedic.benefits')
  .limit(limit * 3); // Get more for better filtering

  // Create a comprehensive list of suggestion terms
  const suggestionTerms = [];
  
  products.forEach(product => {
    // Add product name
    suggestionTerms.push({
      text: product.name,
      type: 'product',
      score: 1.0
    });
    
    // Add brand if it matches
    if (product.brand && product.brand.toLowerCase().includes(query.toLowerCase())) {
      suggestionTerms.push({
        text: product.brand,
        type: 'brand',
        score: 0.9
      });
    }
    
    // Add matching ingredients
    if (product.ayurvedic && product.ayurvedic.ingredients) {
      product.ayurvedic.ingredients.forEach(ingredient => {
        if (ingredient.name && ingredient.name.toLowerCase().includes(query.toLowerCase())) {
          suggestionTerms.push({
            text: ingredient.name,
            type: 'ingredient',
            score: 0.8
          });
        }
      });
    }
    
    // Add matching conditions
    if (product.ayurvedic && product.ayurvedic.conditions) {
      product.ayurvedic.conditions.forEach(condition => {
        if (condition.toLowerCase().includes(query.toLowerCase())) {
          suggestionTerms.push({
            text: condition,
            type: 'condition',
            score: 0.7
          });
        }
      });
    }
    
    // Add matching benefits
    if (product.ayurvedic && product.ayurvedic.benefits) {
      product.ayurvedic.benefits.forEach(benefit => {
        if (benefit.toLowerCase().includes(query.toLowerCase())) {
          suggestionTerms.push({
            text: benefit,
            type: 'benefit',
            score: 0.6
          });
        }
      });
    }
  });

  // Remove duplicates and sort by score
  const uniqueSuggestions = suggestionTerms
    .filter((suggestion, index, self) => 
      index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return uniqueSuggestions;
};

module.exports = {
  searchProducts,
  getSearchSuggestions,
  getSearchFilters,
  getSearchAnalytics
};
