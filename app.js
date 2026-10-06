// app.js — Exam Reading Planner

// 1. Core data: topics to study
const topics = [
  { course: "MTH 101", topic: "Limits and Continuity", hoursNeeded: 4, done: true },
  { course: "MTH 101", topic: "Differentiation", hoursNeeded: 5, done: false },
  { course: "PHY 101", topic: "Kinematics", hoursNeeded: 3, done: true },
  { course: "PHY 101", topic: "Work, Energy and Power", hoursNeeded: 4, done: false },
  { course: "GST 112", topic: "Nigerian Peoples and Culture", hoursNeeded: 6, done: false },
  { course: "CSC 101", topic: "Intro to Algorithms", hoursNeeded: 3, done: false },
];

// 2. filter: topics not yet studied
function getPendingTopics(list) {
  return list.filter((item) => !item.done);
}

// 3. map: just the topic names
function getTopicNames(list) {
  return list.map((item) => item.topic);
}

// 4. reduce: total hours still needed
function getTotalHoursLeft(list) {
  return list.reduce((total, item) => {
    return item.done ? total : total + item.hoursNeeded;
  }, 0);
}

// 5. async: fetch a random piece of advice safely
async function fetchAdvice() {
  try {
    const res = await fetch("https://api.adviceslip.com/advice");

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("Advice:", data.slip.advice);
  } catch (error) {
    console.error("Could not fetch advice:", error.message);
  }
}

// 6. Run everything
console.log("Pending topics:", getPendingTopics(topics));
console.log("All topic names:", getTopicNames(topics));
console.log("Total hours left:", getTotalHoursLeft(topics));
fetchAdvice();
