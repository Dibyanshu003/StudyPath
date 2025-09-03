const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    trackingType: {
      type: String,
      enum: ["time", "questions", "both"],
      required: true,
    },
    targetPerDayMinutes: {
      type: Number,
    },
    targetPerDayQuestions: {
      type: Number,
    },
    colorCode: {
      type: String,
      default: "#FFD700",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
