// /* eslint-disable no-console */
// import { Server } from "http";
// import mongoose from "mongoose";
// import app from "./app";
// import { envVars } from "./app/config/env";
// import { connectRedis } from "./app/config/redis.config";
// // import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

// let server: Server;

// const startServer = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(envVars.DB_URL);
//     console.log("Connected to DB!");

//     // Start the HTTP server
//     server = app.listen(envVars.PORT, () => {
//       console.log(`Server is listening to port ${envVars.PORT}`);
//     });

//     // Try to connect to Redis, but continue even if it fails
//     try {
//       const redisConnected = await connectRedis();
//       if (!redisConnected) {
//         console.log(`
// ----------------------------------------------------------
// ⚠️ WARNING: Redis connection failed!
// The application will continue to run with reduced functionality.
// Features that require Redis (like OTP verification) will use
// an in-memory fallback, which is not recommended for production.

// Please check your Redis configuration in the .env file:
// REDIS_HOST=${envVars.REDIS_HOST}
// REDIS_PORT=${envVars.REDIS_PORT}
// ----------------------------------------------------------
// `);
//       }
//     } catch (redisError) {
//       console.error("Failed to connect to Redis:", redisError);
//       console.log("Application will continue without Redis support");
//     }

//     // Uncomment to seed super admin if needed
//     // await seedSuperAdmin();
    
//   } catch (error) {
//     console.log("Failed to start server:", error);
//     process.exit(1);
//   }
// };

// // Start the server
// startServer();

// // Signal handlers for graceful shutdown
// // SIGTERM handler
// process.on("SIGTERM", () => {
//   console.log(`
// =======================================
// 📢 SIGTERM received!
// Shutting down the server gracefully...
// =======================================
// `);

//   if (server) {
//     server.close(() => {
//       mongoose.connection.close(false).then(() => {
//         console.log("MongoDB connection closed.");
//         process.exit(0);
//       }).catch(err => {
//         console.error("Error closing MongoDB connection:", err);
//         process.exit(1);
//       });
//     });
//   } else {
//     process.exit(0);
//   }
// });

// // SIGINT handler (Ctrl+C)
// process.on("SIGINT", () => {
//   console.log(`
// =======================================
// 📢 SIGINT received!
// Shutting down the server gracefully...
// =======================================
// `);

//   if (server) {
//     server.close(() => {
//       mongoose.connection.close(false).then(() => {
//         console.log("MongoDB connection closed.");
//         process.exit(0);
//       }).catch(err => {
//         console.error("Error closing MongoDB connection:", err);
//         process.exit(1);
//       });
//     });
//   } else {
//     process.exit(0);
//   }
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//   console.error(err.name, err.message);
//   process.exit(1);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.error('UNHANDLED REJECTION! 💥 Shutting down...');
//   console.error(err);
  
//   if (server) {
//     server.close(() => {
//       process.exit(1);
//     });
//   } else {
//     process.exit(1);
//   }
// });


/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { connectRedis } from "./app/config/redis.config";
import { seedSampleData } from "./app/utils/seedSampleData";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

let server: Server;
const isProd = process.env.NODE_ENV === "production";

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await mongoose.connect(envVars.DB_URL);
    console.log("✅ Connected to MongoDB");

    // 2. Connect Redis (safe fallback in prod)
    try {
      const redisConnected = await connectRedis();
      if (!redisConnected && isProd) {
        console.log(`
----------------------------------------------------------
⚠️ WARNING: Redis connection failed!
The application will continue to run with reduced functionality.
Features that require Redis (like OTP verification, caching)
may fallback to in-memory, which is NOT recommended for prod.
----------------------------------------------------------
        `);
      }
    } catch (redisError) {
      console.error("❌ Failed to connect to Redis:", redisError);
      if (!isProd) {
        console.log("ℹ️ Dev mode: continuing without Redis");
      }
    }

    // 3. Start HTTP server
    server = app.listen(envVars.PORT, () => {
      console.log(`🚀 Server running on port ${envVars.PORT}`);
    });

    // 4. Seed admin and sample data if needed
    await seedSuperAdmin();
    await seedSampleData();

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Run
startServer();


// ----------------- Graceful Shutdown -----------------
const shutdown = async (signal: string) => {
  console.log(`
=======================================
📢 ${signal} received!
Shutting down the server gracefully...
=======================================
  `);

  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log("✅ MongoDB connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Extra safety for prod
if (isProd) {
  process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    console.error("💥 UNHANDLED REJECTION:", err);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
}

// Export app for Vercel
// export default app;
