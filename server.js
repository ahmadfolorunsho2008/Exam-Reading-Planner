//Exam Reading Planner API
const express = require("express");

const app = express();
app.use(express.json());

// In-memory data
let items = [
  { id: 1, course: "MTH 101", topic: "Limits and Continuity", hoursNeeded: 4, done: true },
  { id: 2, course: "MTH 101", topic: "Differentiation", hoursNeeded: 5, done: false },
  { id: 3, course: "PHY 101", topic: "Kinematics", hoursNeeded: 3, done: true },
  { id: 4, course: "GST 112", topic: "Nigerian Peoples and Culture", hoursNeeded: 6, done: false },
];
let nextId = 5;

// Reused from Week 1 (app.js): total hours still needed
function getTotalHoursLeft(list) {
  return list.reduce((total, item) => {
    return item.done ? total : total + item.hoursNeeded;
  }, 0);
}

// BONUS: GET /hours-left
// (defined before any "/:id" routes so it is never mistaken for an id)
app.get("/hours-left", (req, res) => {
  res.json({ hoursLeft: getTotalHoursLeft(items) });
});

// 1. GET /items  (optional filters: ?course=MTH 101  and  ?done=true|false)
app.get("/items", (req, res) => {
  const { course, done } = req.query;
  let result = items;

  if (course !== undefined) {
    result = result.filter(
      (item) => item.course.toLowerCase() === course.toLowerCase()
    );
  }

  if (done !== undefined) {
    // Query values are strings, so compare to "true" / "false"
    if (done !== "true" && done !== "false") {
      return res.status(400).json({ error: 'done must be "true" or "false"' });
    }
    result = result.filter((item) => String(item.done) === done);
  }

  res.json(result);
});

// 2. GET /items/:id
app.get("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);

  if (!item) {
    return res.status(404).json({ error: "Topic not found" });
  }
  res.json(item);
});

// 3. POST /items  (course, topic and hoursNeeded required)
app.post("/items", (req, res) => {
  const { course, topic, hoursNeeded, done } = req.body || {};

  if (!course || !topic || typeof hoursNeeded !== "number") {
    return res.status(400).json({
      error: "course, topic and hoursNeeded (a number) are required",
    });
  }

  const newItem = {
    id: nextId++,
    course,
    topic,
    hoursNeeded,
    done: done === true,
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

// 4. PUT /items/:id  (only allowed fields; id is never copied from the body)
app.put("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);

  if (!item) {
    return res.status(404).json({ error: "Topic not found" });
  }

  const { course, topic, hoursNeeded, done } = req.body || {};

  if (course !== undefined) item.course = course;
  if (topic !== undefined) item.topic = topic;
  if (typeof hoursNeeded === "number") item.hoursNeeded = hoursNeeded;
  if (typeof done === "boolean") item.done = done;

  res.json(item);
});

// 5. DELETE /items/:id
app.delete("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = items.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Topic not found" });
  }

  const [removed] = items.splice(index, 1);
  res.json({ message: "Topic deleted", item: removed });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Exam Reading Planner API running on http://localhost:${PORT}`);
});
