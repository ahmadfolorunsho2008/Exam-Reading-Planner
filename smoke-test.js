// smoke-test.js — start the server first (npm run dev), then run: node smoke-test.js
require("dotenv").config();

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const MISSING_ID = "507f1f77bcf86cd799439011"; // valid shape, but no such topic

let passed = 0;
let failed = 0;
const createdIds = []; // so we can clean up at the end

function check(name, condition) {
  if (condition) {
    passed++;
    console.log("  PASS", name);
  } else {
    failed++;
    console.log("  FAIL", name);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

async function api(method, path, body, rawBody) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (rawBody !== undefined) {
    options.body = rawBody;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = null;
  }
  return { status: res.status, body: json, location: res.headers.get("location") };
}

function hasEnvelope(r) {
  return (
    r.body !== null &&
    typeof r.body.success === "boolean" &&
    "data" in r.body &&
    "error" in r.body
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // A unique name for every run, so old test data can never clash
  const run = Date.now().toString(36).toUpperCase();
  const course = `SMK-${run}`;
  const base = { course, topic: `Base topic ${run}`, hoursNeeded: 2, done: false };

  let r;

  // ------------------------------------------------------------------ health
  section("Health");
  r = await api("GET", "/health");
  check("GET /health returns 200", r.status === 200);
  check("health shows readyState 1", r.body.data.readyState === 1);
  check("health uses the envelope", hasEnvelope(r) && r.body.success === true);

  // ------------------------------------------------------------------ create
  section("Create (POST /topics)");
  r = await api("POST", "/topics", {
    course,
    topic: `Limits ${run}`,
    hoursNeeded: 4,
    done: false,
    priority: "high",
    examDate: "2026-12-15",
  });
  check("create returns 201", r.status === 201);
  check("create uses the envelope", hasEnvelope(r) && r.body.success === true && r.body.error === null);
  const created = r.body.data;
  const id = created.id;
  createdIds.push(id);
  check("response has a string id", typeof id === "string" && id.length === 24);
  check("response hides _id and __v", !("_id" in created) && !("__v" in created));
  check("response has createdAt and updatedAt", Boolean(created.createdAt) && Boolean(created.updatedAt));
  check("Location header points to the new topic", Boolean(r.location) && r.location.endsWith(`/topics/${id}`));
  check("course is saved in capitals", created.course === course);
  check("priority is saved", created.priority === "high");

  r = await api("POST", "/topics", { ...base, topic: `Default priority ${run}` });
  createdIds.push(r.body.data && r.body.data.id);
  check("priority defaults to medium", r.status === 201 && r.body.data.priority === "medium");

  // ------------------------------------------------------- validation (400)
  section("Validation failures (400)");
  const { done: _omit, ...withoutDone } = base;
  const badBodies = [
    ["a too-short topic", { ...base, topic: "ab" }],
    ["a too-long topic", { ...base, topic: "x".repeat(101) }],
    ["a whitespace-only topic", { ...base, topic: "     " }],
    ["hoursNeeded below 0.5", { ...base, hoursNeeded: 0 }],
    ["hoursNeeded above 40", { ...base, hoursNeeded: 41 }],
    ["an unknown priority", { ...base, priority: "urgent" }],
    ["a missing done", withoutDone],
    ["a done that is not a boolean", { ...base, done: "banana" }],
    ["an invalid examDate", { ...base, examDate: "not-a-date" }],
    ["an unknown field (strict throw)", { ...base, color: "red" }],
    ["a client-supplied id", { ...base, id: "123" }],
  ];
  for (const [label, body] of badBodies) {
    r = await api("POST", "/topics", body);
    check(`rejects ${label} with 400`, r.status === 400 && hasEnvelope(r) && r.body.success === false);
  }

  r = await api("POST", "/topics", undefined, "{ this is not json");
  check("rejects invalid JSON with 400", r.status === 400 && hasEnvelope(r));

  // -------------------------------------------------------- duplicate (409)
  section("Unique index (409)");
  r = await api("POST", "/topics", {
    course,
    topic: `Limits ${run}`,
    hoursNeeded: 1,
    done: false,
  });
  check("duplicate course + topic returns 409", r.status === 409);
  check("duplicate error uses the envelope", hasEnvelope(r) && r.body.success === false);

  // -------------------------------------------------------------------- read
  section("Read");
  r = await api("GET", "/topics");
  check("GET /topics returns 200 with a list", r.status === 200 && Array.isArray(r.body.data));
  check("the list contains the new topic", r.body.data.some((t) => t.id === id));

  r = await api("GET", `/topics?course=${encodeURIComponent(course)}`);
  check("?course filter keeps only that course", r.status === 200 && r.body.data.length === 2);

  r = await api("GET", `/topics?course=${encodeURIComponent(course)}&done=false`);
  check("?done=false filter works", r.status === 200 && r.body.data.every((t) => t.done === false));

  r = await api("GET", "/topics?done=maybe");
  check("?done=maybe returns 400", r.status === 400);

  r = await api("GET", "/topics/stats");
  check("GET /topics/stats returns 200", r.status === 200 && r.body.success === true);
  check(
    "stats has numbers that add up",
    typeof r.body.data.total === "number" &&
      typeof r.body.data.hoursLeft === "number" &&
      r.body.data.done + r.body.data.pending === r.body.data.total
  );

  r = await api("GET", `/topics/${id}`);
  check("GET one topic returns 200", r.status === 200 && r.body.data.id === id);
  check("GET one uses the envelope", hasEnvelope(r));

  r = await api("GET", "/topics/not-an-id");
  check("malformed id returns 400", r.status === 400 && hasEnvelope(r));

  r = await api("GET", `/topics/${MISSING_ID}`);
  check("valid but missing id returns 404", r.status === 404 && hasEnvelope(r));

  r = await api("GET", "/nothing-here");
  check("unknown route returns 404", r.status === 404 && hasEnvelope(r));

  // --------------------------------------------------------------------- PUT
  section("Replace (PUT)");
  r = await api("PUT", `/topics/${id}`, {
    course,
    topic: `Limits ${run}`,
    hoursNeeded: 6,
    done: false,
  });
  check("PUT returns 200", r.status === 200);
  check("PUT changes hoursNeeded", r.body.data.hoursNeeded === 6);
  check("PUT resets priority to medium when not sent", r.body.data.priority === "medium");

  r = await api("PUT", `/topics/${id}`, { course });
  check("PUT with missing fields returns 400", r.status === 400);

  r = await api("PUT", `/topics/${MISSING_ID}`, { ...base });
  check("PUT on a missing id returns 404", r.status === 404);

  r = await api("POST", "/topics", { ...base, topic: `Second topic ${run}` });
  const secondId = r.body.data.id;
  createdIds.push(secondId);
  r = await api("PUT", `/topics/${secondId}`, {
    course,
    topic: `Limits ${run}`,
    hoursNeeded: 3,
    done: false,
  });
  check("PUT that duplicates another topic returns 409", r.status === 409);

  // ------------------------------------------------------------------- PATCH
  section("Update (PATCH)");
  await wait(25); // so updatedAt is clearly later than createdAt
  r = await api("PATCH", `/topics/${id}`, { priority: "low" });
  check("PATCH returns 200 and changes priority", r.status === 200 && r.body.data.priority === "low");
  check(
    "updatedAt moved forward after the update",
    new Date(r.body.data.updatedAt) > new Date(r.body.data.createdAt)
  );

  r = await api("PATCH", `/topics/${id}`, { hoursNeeded: 100 });
  check("PATCH with an out-of-range number returns 400", r.status === 400);

  r = await api("PATCH", `/topics/${id}`, {});
  check("PATCH with no fields returns 400", r.status === 400);

  r = await api("PATCH", `/topics/${MISSING_ID}`, { priority: "low" });
  check("PATCH on a missing id returns 404", r.status === 404);

  r = await api("PATCH", `/topics/${secondId}`, { topic: `Limits ${run}` });
  check("PATCH that duplicates another topic returns 409", r.status === 409);

  // ----------------------------------------------------------- business rule
  section("Business rule: finished topics are locked (409)");
  r = await api("PATCH", `/topics/${id}`, { done: true });
  check("marking a topic done returns 200", r.status === 200 && r.body.data.done === true);

  r = await api("PATCH", `/topics/${id}`, { hoursNeeded: 8 });
  check("changing a done topic returns 409", r.status === 409 && hasEnvelope(r));

  r = await api("GET", `/topics/${id}`);
  check("the locked topic was not changed", r.body.data.hoursNeeded === 6);

  r = await api("PATCH", `/topics/${id}`, { done: false, hoursNeeded: 8 });
  check("reopening with done: false allows changes", r.status === 200 && r.body.data.hoursNeeded === 8);

  // ------------------------------------------------------------------ delete
  section("Delete");
  r = await api("DELETE", `/topics/${secondId}`);
  check("DELETE returns 200", r.status === 200 && r.body.success === true);

  r = await api("DELETE", `/topics/${secondId}`);
  check("deleting again returns 404", r.status === 404);

  r = await api("GET", `/topics/${secondId}`);
  check("GET after delete returns 404", r.status === 404);

  r = await api("DELETE", "/topics/not-an-id");
  check("DELETE with a malformed id returns 400", r.status === 400);

  // ----------------------------------------------------------------- summary
  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
}

async function cleanUp() {
  for (const topicId of createdIds) {
    if (topicId) {
      try {
        await api("DELETE", `/topics/${topicId}`);
      } catch (e) {
        // ignore
      }
    }
  }
}

main()
  .catch((err) => {
    failed++;
    console.error(`\nCould not finish the tests: ${err.message}`);
    console.error(`Is the server running at ${BASE}? Start it with: npm run dev`);
  })
  .then(cleanUp)
  .then(() => process.exit(failed > 0 ? 1 : 0));
