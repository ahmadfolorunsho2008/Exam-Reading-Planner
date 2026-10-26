// server.js — Exam Reading Planner API (MongoDB Atlas)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Topic = require("./Topic");
const topicRoutes = require("./topicRoutes");
const { sendOk, sendFail } = require("./respond");

const app = express();
app.use(express.json());

// GET /health  (proves the database is connected: readyState 1)
app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    return sendOk(res, 200, { database: "connected", readyState: state });
  }
  sendFail(res, 503, `Database not ready (readyState ${state})`);
});

app.use("/topics", topicRoutes);

// Unknown route
app.use((req, res) => {
  sendFail(res, 404, "Route not found");
});

// Last-resort error handler (for example, a request body that is not valid JSON)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return sendFail(res, 400, "Request body is not valid JSON");
  }
  console.error(err);
  sendFail(res, 500, "Something went wrong on the server");
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await Topic.init(); // make sure the unique index exists before taking requests

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Exam Reading Planner API running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Could not start the server:", err.message);
  process.exit(1);
});
