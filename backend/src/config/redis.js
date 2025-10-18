const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    // Skip Redis connection if explicitly disabled
    if (process.env.SKIP_REDIS === 'true') {
      console.log('⚠️  Redis connection skipped (SKIP_REDIS=true)');
      return null;
    }

    if (!redisClient) {
      // Redis v4+ API configuration
      redisClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log('⚠️  Redis connection limit reached, continuing without cache');
              return false;
            }
            console.log(`⚠️  Redis server connection refused, retrying... (${retries}/3)`);
            return Math.min(retries * 100, 3000);
          }
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        console.log('⚠️  Continuing without Redis cache');
        redisClient = null;
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis Connected to localhost:6379');
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis Ready for operations');
      });

      redisClient.on('end', () => {
        console.log('⚠️  Redis connection ended');
      });

      await redisClient.connect();
    }
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Server will continue without Redis caching');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient
};
