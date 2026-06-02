/**
 * @fileoverview MongoDB connection helper.
 * Wraps mongoose.connect with retry-friendly error handling and
 * lifecycle event logging so connection issues surface immediately.
 */

import mongoose from "mongoose";
import config from "./env.js";

/**
 * Connect to MongoDB using the URI defined in config.
 * Registers event listeners for connection lifecycle events.
 * Implements retry logic for better resilience.
 * @returns {Promise<typeof mongoose>} The mongoose instance after a successful connection.
 */
const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;

  const attemptConnection = async () => {
    try {
      // ── Lifecycle listeners ──────────────────────────────────────────
      mongoose.connection.on("connected", () => {
        console.log("✅ MongoDB connected successfully");
      });

      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("🛑 MongoDB connection closed (app termination)");
        process.exit(0);
      });

      // ── Establish connection ─────────────────────────────────────────
      const conn = await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 20000,
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      console.log(`📦 MongoDB host: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.db.databaseName}`);
      return conn;
    } catch (error) {
      retries++;
      console.error(
        `💥 MongoDB connection failed (attempt ${retries}/${maxRetries}):`,
        error.message,
      );

      if (retries < maxRetries) {
        const delay = 5000 * retries; // Progressive backoff: 5s, 10s, 15s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptConnection();
      }

      console.warn("\n⚠️  MONGODB CONNECTION FAILED");
      console.warn(
        "📝 Ensure MongoDB is running: mongod --version or use MongoDB Atlas",
      );
      console.warn(`📝 Connection string: ${config.MONGODB_URI}`);
      console.warn("⚙️  Running in offline mode - data will not persist\n");
      return null;
    }
  };

  return attemptConnection();
};

export default connectDB;
