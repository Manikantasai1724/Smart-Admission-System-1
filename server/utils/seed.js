/**
 * @fileoverview Database seeder.
 * Creates default users (Admin, HODs, and Volunteers) for CSE, AIML, and CIC departments.
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
    password: "admin123",
    role: "Admin",
    department: "ALL",
  },
  {
    name: "CSE HOD",
    username: "hod",
    email: "hod.cse@college.edu",
    password: "hod123",
    role: "HOD",
    department: "CSE",
  },
  {
    name: "CSE Volunteer",
    username: "volunteer",
    email: "volunteer.cse@college.edu",
    password: "vol123",
    role: "Volunteer",
    department: "CSE",
  },
  {
    name: "AIML HOD",
    username: "hod_aiml",
    email: "hod.aiml@college.edu",
    password: "hod123",
    role: "HOD",
    department: "AIML",
  },
  {
    name: "AIML Volunteer",
    username: "volunteer_aiml",
    email: "volunteer.aiml@college.edu",
    password: "vol123",
    role: "Volunteer",
    department: "AIML",
  },
  {
    name: "CIC HOD",
    username: "hod_cic",
    email: "hod.cic@college.edu",
    password: "hod123",
    role: "HOD",
    department: "CIC",
  },
  {
    name: "CIC Volunteer",
    username: "volunteer_cic",
    email: "volunteer.cic@college.edu",
    password: "vol123",
    role: "Volunteer",
    department: "CIC",
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
          `  👤 Created user: ${doc.name} (${doc.role}) — @${doc.username}`
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
    console.log("  Main Admin    → admin           / admin123");
    console.log("  CSE HOD       → hod             / hod123");
    console.log("  CSE Volunteer → volunteer       / vol123");
    console.log("  AIML HOD      → hod_aiml        / hod123");
    console.log("  AIML Vol      → volunteer_aiml  / vol123");
    console.log("  CIC HOD       → hod_cic         / hod123");
    console.log("  CIC Vol       → volunteer_cic   / vol123");
  } catch (error) {
    console.error("💥 Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seed();
