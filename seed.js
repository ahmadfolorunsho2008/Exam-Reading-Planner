// seed.js — clears the topics collection and inserts 20 sample topics
// Run with: node seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./Topic");

const plan = {
  "MTH 101": ["Limits and Continuity", "Differentiation", "Integration", "Sequences and Series"],
  "PHY 101": ["Kinematics", "Newton's Laws", "Work, Energy and Power", "Waves"],
  "CHM 101": ["Atomic Structure", "Chemical Bonding", "Stoichiometry", "Acids and Bases"],
  "GST 112": ["Nigerian Peoples", "Cultural Heritage", "Nation Building", "Traditional Governance"],
  "CSC 101": ["Intro to Algorithms", "Number Systems", "Flowcharts", "Intro to Programming"],
};

const priorities = ["low", "medium", "high"];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await Topic.init();

  const docs = [];
  let i = 0;
  for (const [course, topics] of Object.entries(plan)) {
    for (const topic of topics) {
      docs.push({
        course,
        topic,
        hoursNeeded: 2 + (i % 5),
        priority: priorities[i % 3],
        examDate: `2026-12-${String(10 + (i % 10)).padStart(2, "0")}`,
        done: i % 3 === 0,
      });
      i++;
    }
  }

  await Topic.deleteMany({});
  await Topic.insertMany(docs);
  console.log(`Seeded ${docs.length} topics`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
