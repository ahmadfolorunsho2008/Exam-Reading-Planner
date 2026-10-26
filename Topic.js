const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    // Text length (checked AFTER trimming)
    course: {
      type: String,
      required: [true, "course is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "course must be at least 2 characters"],
      maxlength: [20, "course must be at most 20 characters"],
    },
    topic: {
      type: String,
      required: [true, "topic is required"],
      trim: true,
      minlength: [3, "topic must be at least 3 characters"],
      maxlength: [100, "topic must be at most 100 characters"],
    },
    // Number range
    hoursNeeded: {
      type: Number,
      required: [true, "hoursNeeded is required"],
      min: [0.5, "hoursNeeded must be at least 0.5"],
      max: [40, "hoursNeeded must be at most 40"],
    },
    // Fixed list of allowed values
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "priority must be low, medium or high",
      },
      default: "medium",
    },
    // A real date (send it like 2026-12-15 or 2026-12-15T09:00:00Z, which is UTC)
    examDate: { type: Date },
    // Required boolean
    done: {
      type: Boolean,
      required: [true, "done is required (true or false)"],
    },
  },
  {
    timestamps: true, // Mongoose handles createdAt and updatedAt
    strict: "throw", // unknown fields cause an error instead of being dropped
  }
);

// Unique index: the same topic cannot be added twice for the same course
topicSchema.index({ course: 1, topic: 1 }, { unique: true });

// Show id, hide _id and __v
topicSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Topic", topicSchema);
