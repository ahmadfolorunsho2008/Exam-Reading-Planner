# Exam Reading Planner

A small tool that helps students plan exam preparation by tracking topics to study for each course, how many hours each topic needs, and whether it has been covered.

Week 1 was plain JavaScript (`app.js`). Week 2 turns it into an Express API (`server.js`). Next, I plan to add a database and user login so students can save their own reading plans.

## Run it

```
npm install
npm run dev
```

The server runs on http://localhost:3000

## Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| GET | /items | Returns all topics. Optional filters: `?course=MTH 101` and `?done=true` or `?done=false` |
| GET | /items/:id | Returns one topic, or 404 if it doesn't exist |
| POST | /items | Adds a topic (`course`, `topic`, `hoursNeeded` required). Returns 201, or 400 if a field is missing |
| PUT | /items/:id | Updates a topic's `course`, `topic`, `hoursNeeded` or `done`. Returns 404 if not found |
| DELETE | /items/:id | Deletes a topic. Returns 404 if not found |
| GET | /hours-left | Bonus: total study hours still needed (reuses the Week 1 `reduce` function) |
