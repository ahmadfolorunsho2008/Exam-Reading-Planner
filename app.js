//Exam Reading Planner

// 1. Topics to study
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
console.log("Pending topics:", getPendingTopics(topics));

// 3. map: just the topic names
function getTopicNames(list) {
  return list.map((item) => item.topic);
}
console.log("All topic names:", getTopicNames(topics));

// 4. reduce: total hours still needed
function getTotalHoursLeft(list) {
  return list.reduce((total, item) => {
    return item.done ? total : total + item.hoursNeeded;
  }, 0);
}
console.log("Total hours left:", getTotalHoursLeft(topics));

// 5. async.
async function fetchAdvice() {
  try {
    const res = await fetch("https://api.adviceslip.com/advice");
