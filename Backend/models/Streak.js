const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: {
      type: String, // format: YYYY-MM-DD
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Streak", streakSchema);
