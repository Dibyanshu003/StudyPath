const mongoose = require("mongoose");

const AIInsightsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weekStart: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  weekEnd: {
    type: String,
    required: true,
  },
  feedbackText: {
    type: String,
    required: true,
  },
  motivationalText: {
    type: String,
    required: true,
  },
  riskAreas: {
    type: String,
    required: true,
  },
  comparisonWithLastWeek: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("AIInsights", AIInsightsSchema);
