
// import { createClient } from 'redis';
// import { envVars } from './env';

// // Create a Redis client with a more robust configuration
// export const redisClient = createClient({
//     username: envVars.REDIS_USERNAME,
//     password: envVars.REDIS_PASSWORD,
//     socket: {
//         host: envVars.REDIS_HOST,
//         port: Number(envVars.REDIS_PORT),
//         reconnectStrategy: (retries) => {
//             // Maximum wait time between reconnect attempts (10 seconds)
//             const maxReconnectDelay = 10000;
//             // Base delay (1 second)
//             const baseReconnectDelay = 1000;
//             // Exponential backoff with maximum delay
//             const delay = Math.min(
//                 Math.pow(2, retries) * baseReconnectDelay,
//                 maxReconnectDelay
//             );
//             console.log(`Redis reconnection attempt #${retries} in ${delay}ms`);
//             return delay;
//         },
//         connectTimeout: 10000 // 10 seconds timeout for connection attempts
//     }
// });

// // Improved error handling for Redis client
// redisClient.on('error', (err) => {
//     console.log('Redis Client Error', err);
    
//     // If this is a connection error, provide more helpful information
//     if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
//         console.log(`
// ------------------------------------------------------
// REDIS CONNECTION FAILED:
// - Host: ${envVars.REDIS_HOST}
// - Port: ${envVars.REDIS_PORT}

// Possible reasons:
// 1. The Redis host name is incorrect
// 2. Your network cannot reach the Redis server
// 3. The Redis service might be down
// 4. Credentials might have changed

// The application will continue running, but Redis features
// like caching and session storage may not work correctly.
// ------------------------------------------------------
// `);
//     }
// });

// // Connection and status events
// redisClient.on('connect', () => console.log('Redis client connecting...'));
// redisClient.on('ready', () => console.log('Redis client connected and ready to use'));
// redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));
// redisClient.on('end', () => console.log('Redis client connection closed'));

// // Function to connect to Redis with fallback
// export const connectRedis = async () => {
//     try {
//         if (!redisClient.isOpen) {
//             await redisClient.connect();
//             console.log("Redis Connected Successfully");
//             return true;
//         }
//         return true;
//     } catch (error) {
//         console.error("Failed to connect to Redis:", error);
//         console.log("Application will continue without Redis support");
//         return false;
//     }
// }



import { createClient } from 'redis';
import { envVars } from './env';

const isProd = process.env.NODE_ENV === 'production';

export const redisClient = createClient({
  username: envVars.REDIS_USERNAME,
  password: envVars.REDIS_PASSWORD,
  socket: {
    host: envVars.REDIS_HOST,
    port: Number(envVars.REDIS_PORT),
    ...(isProd && {
      // Only apply in production
      reconnectStrategy: (retries) => {
        const maxReconnectDelay = 10000; // 10 seconds
        const baseReconnectDelay = 1000; // 1 second
        const delay = Math.min(Math.pow(2, retries) * baseReconnectDelay, maxReconnectDelay);
        console.log(`Redis reconnection attempt #${retries} in ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000, // 10 seconds timeout
    }),
  },
});

// Common error handling
redisClient.on('error', (err) => {
  console.log('Redis Client Error:', err);

  if (isProd && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')) {
    console.log(`
------------------------------------------------------
REDIS CONNECTION FAILED:
- Host: ${envVars.REDIS_HOST}
- Port: ${envVars.REDIS_PORT}

Possible reasons:
1. Host name is incorrect
2. Network cannot reach the Redis server
3. Redis service might be down
4. Credentials might have changed

App will continue running, but Redis features 
(caching, sessions, rate-limits) may not work.
------------------------------------------------------
    `);
  }
});

// Extra events only in production
if (isProd) {
  redisClient.on('connect', () => console.log('Redis client connecting...'));
  redisClient.on('ready', () => console.log('Redis client connected and ready to use'));
  redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));
  redisClient.on('end', () => console.log('Redis client connection closed'));
}

// Connection function
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis Connected');
      return true;
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    if (!isProd) {
      console.log('ℹ️ Running in development mode without Redis');
    }
    return false;
  }
};





