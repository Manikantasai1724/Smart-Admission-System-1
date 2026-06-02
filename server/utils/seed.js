/**
 * @fileoverview Database seeder.
 * Creates default users (HOD + Volunteer) for CSE, AIML, and CIC departments.
 *
 * Run:  node utils/seed.js
 */

import mongoose from "mongoose";
import config from "../config/env.js";
import User from "../models/User.js";

// ── Seed Users ─────────────────────────────────────────
const seedUsers = [
  {
    name: "Main Admin",
    username: "admin",
    email: "admin@college.edu",
    password: "admin@123",
    role: "Admin",
    department: "ALL",
  }
];

// ── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    console.log("🌱 Connecting to MongoDB…");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing users to apply new names/roles cleanly
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users");

    let usersCreated = 0;

    for (const u of seedUsers) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        const doc = await User.create(u);
        usersCreated++;
        console.log(
          `  👤 Created user: ${doc.name} (${doc.role}) — @${doc.username}`,
        );
      } else {
        console.log(`  ⏭️  User already exists: @${u.username}`);
      }
    }

    // ── Summary ───────────────────────────────────────────────────
    const totalUsers = await User.countDocuments();

    console.log("\n🎉 Seed complete!");
    console.log("─────────────────────────────────");
    console.log(`  Users created this run : ${usersCreated}`);
    console.log(`  Total users            : ${totalUsers}`);
    console.log("─────────────────────────────────\n");

    console.log("📋 Login credentials:");
    console.log("  Main Admin → admin           / admin@123");
  } catch (error) {
    console.error("💥 Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seed();
