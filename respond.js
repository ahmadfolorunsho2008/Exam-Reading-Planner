// Every response has the same shape: { success, data, error }

function sendOk(res, status, data) {
  return res.status(status).json({ success: true, data, error: null });
}

function sendFail(res, status, message) {
  return res.status(status).json({ success: false, data: null, error: message });
}

// One place that turns database errors into HTTP statuses
function sendDbError(res, err) {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return sendFail(res, 400, message);
  }

  // Unknown field (because the schema uses strict: "throw")
  if (err.name === "StrictModeError") {
    return sendFail(res, 400, err.message);
  }

  // Duplicate key
  if (err.code === 11000) {
    return sendFail(res, 409, "That topic already exists for this course");
  }

  console.error(err);
  return sendFail(res, 500, "Something went wrong on the server");
}

module.exports = { sendOk, sendFail, sendDbError };
