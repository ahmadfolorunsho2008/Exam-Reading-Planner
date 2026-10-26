const express = require("express");
const mongoose = require("mongoose");
const Topic = require("./Topic");
const { sendOk, sendFail, sendDbError } = require("./respond");

const router = express.Router();

const FORBIDDEN_KEYS = ["_id", "id", "__v", "createdAt", "updatedAt"];
const REQUIRED_FOR_PUT = ["course", "topic", "hoursNeeded", "done"];
const LOCKED_WHEN_DONE = ["course", "topic", "hoursNeeded", "priority", "examDate"];

// Returns a message if the body is not usable, otherwise null
function checkBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }
  const bad = FORBIDDEN_KEYS.filter((key) => key in body);
  if (bad.length > 0) {
    return `You cannot set: ${bad.join(", ")}`;
  }
  return null;
}

// Every route with :id gets this check first (400 if the id has a bad shape)
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return sendFail(res, 400, "Invalid topic id");
  }
  next();
});

// GET /topics  (optional filters: ?course=MTH 101 and ?done=true|false)
router.get("/", async (req, res) => {
  try {
    let topics = await Topic.find().sort({ createdAt: 1 });

    if (req.query.course !== undefined) {
      const wanted = String(req.query.course).trim().toUpperCase();
      topics = topics.filter((t) => t.course === wanted);
    }

    if (req.query.done !== undefined) {
      if (req.query.done !== "true" && req.query.done !== "false") {
        return sendFail(res, 400, 'done must be "true" or "false"');
      }
      topics = topics.filter((t) => String(t.done) === req.query.done);
    }

    sendOk(res, 200, topics);
  } catch (err) {
    sendDbError(res, err);
  }
});

// GET /topics/stats  (must stay ABOVE /:id so "stats" is not read as an id)
router.get("/stats", async (req, res) => {
  try {
    const topics = await Topic.find();

    const doneCount = topics.filter((t) => t.done).length;
    const hoursLeft = topics.reduce((sum, t) => (t.done ? sum : sum + t.hoursNeeded), 0);

    const byCourse = {};
    for (const t of topics) {
      byCourse[t.course] = (byCourse[t.course] || 0) + 1;
    }

    sendOk(res, 200, {
      total: topics.length,
      done: doneCount,
      pending: topics.length - doneCount,
      hoursLeft: Math.round(hoursLeft * 100) / 100,
      byCourse,
    });
  } catch (err) {
    sendDbError(res, err);
  }
});

// GET /topics/:id
router.get("/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return sendFail(res, 404, "Topic not found");
    }
    sendOk(res, 200, topic);
  } catch (err) {
    sendDbError(res, err);
  }
});

// POST /topics
router.post("/", async (req, res) => {
  const problem = checkBody(req.body);
  if (problem) {
    return sendFail(res, 400, problem);
  }

  try {
    const topic = new Topic(req.body);
    await topic.save();
    res.location(`/topics/${topic.id}`);
    sendOk(res, 201, topic);
  } catch (err) {
    sendDbError(res, err);
  }
});

// PUT and PATCH share this: load, set, save
async function updateTopic(req, res, isPut) {
  const problem = checkBody(req.body);
  if (problem) {
    return sendFail(res, 400, problem);
  }

  if (isPut) {
    const missing = REQUIRED_FOR_PUT.filter((key) => req.body[key] === undefined);
    if (missing.length > 0) {
      return sendFail(res, 400, `PUT needs: ${missing.join(", ")}`);
    }
  } else if (Object.keys(req.body).length === 0) {
    return sendFail(res, 400, "Send at least one field to update");
  }

  try {
    // 1. load
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return sendFail(res, 404, "Topic not found");
    }

    // Business rule: a finished topic is locked until you set done to false
    if (topic.done && req.body.done !== false) {
      const touched = LOCKED_WHEN_DONE.filter((key) => req.body[key] !== undefined);
      if (touched.length > 0) {
        return sendFail(
          res,
          409,
          `This topic is already done, so ${touched.join(", ")} cannot be changed. Set done to false first.`
        );
      }
    }

    // 2. set
    if (isPut) {
      // PUT replaces everything, so optional fields not sent go back to default/empty
      topic.set({ priority: "medium", examDate: undefined, ...req.body });
    } else {
      topic.set(req.body);
    }

    // 3. save (this runs the validators)
    await topic.save();
    sendOk(res, 200, topic);
  } catch (err) {
    sendDbError(res, err);
  }
}

// PUT /topics/:id
router.put("/:id", (req, res) => updateTopic(req, res, true));

// PATCH /topics/:id
router.patch("/:id", (req, res) => updateTopic(req, res, false));

// DELETE /topics/:id
router.delete("/:id", async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return sendFail(res, 404, "Topic not found");
    }
    sendOk(res, 200, topic);
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
