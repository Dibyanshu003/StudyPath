const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
    },
    duration: {
      type: Number, // in minutes
    },
    questionsSolved: {
      type: Number,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", sessionSchema);
