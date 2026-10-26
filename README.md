# Exam Reading Planner

A small API that helps students plan exam preparation by tracking topics to study for each course, how many hours each topic needs, its priority, the exam date, and whether it has been covered.

Week 1 was plain JavaScript (`app.js`). Week 2 added an Express server with an in-memory array. Week 3 moves the data to MongoDB Atlas using Mongoose. Next, I plan to add database queries and user login so each student has their own reading plan.

## Setup

1. Create a free cluster on MongoDB Atlas, add a database user, and allow your IP address under Network Access.
2. Copy `.env.example` to a new file named `.env` and fill in your own values:

```
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<your-cluster>.mongodb.net/exam-planner?retryWrites=true&w=majority
PORT=3000
```

3. Install and start:

```
npm install
npm run dev
```

`.env` is in `.gitignore` and must never be committed.

## Test it

With the server running, in a second terminal:

```
node smoke-test.js
```

It runs 60+ checks against the live API, cleans up the data it creates, and exits with code 0 if everything passes or 1 if anything fails.

Optional: `node seed.js` clears the topics collection and inserts 20 sample topics.

## Response format

Every response has the same shape:

```json
{ "success": true, "data": { }, "error": null }
{ "success": false, "data": null, "error": "what went wrong" }
```

## Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| GET | /health | Shows whether the database is connected (readyState 1) |
| GET | /topics | Lists topics. Optional filters: `?course=MTH 101` and `?done=true` or `?done=false` |
| GET | /topics/stats | Counts: total, done, pending, hours left, topics per course |
| GET | /topics/:id | Returns one topic. 400 for a bad id, 404 if it doesn't exist |
| POST | /topics | Creates a topic. Returns 201 with a Location header |
| PUT | /topics/:id | Replaces a topic (course, topic, hoursNeeded and done are required) |
| PATCH | /topics/:id | Updates only the fields you send |
| DELETE | /topics/:id | Deletes a topic |

## Topic fields and rules

| Field | Rule |
|-------|------|
| course | Text, 2 to 20 characters after trimming, saved in capitals |
| topic | Text, 3 to 100 characters after trimming |
| hoursNeeded | Number from 0.5 to 40 |
| priority | `low`, `medium` or `high` (default `medium`) |
| examDate | A real date, sent like `2026-12-15` (UTC) |
| done | Required boolean |

- `createdAt` and `updatedAt` are added by Mongoose.
- Responses show `id` and hide `_id` and `__v`.
- Unknown fields are rejected (strict throw).
- **Unique rule:** the same topic cannot be added twice for the same course (409).
- **Business rule:** once a topic is done, its course, topic, hoursNeeded, priority and examDate are locked. Trying to change them returns 409. Send `done: false` first (you can include other changes in the same request).

## Errors

| Problem | Status |
|---------|--------|
| Validation error (or unknown field) | 400 |
| Bad id format | 400 |
| Valid id that doesn't exist | 404 |
| Duplicate course + topic, or editing a locked topic | 409 |
| Anything else | 500 |
