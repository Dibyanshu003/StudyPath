const Streak = require("../models/Streak");
const StudySession = require("../models/StudySession");

exports.getStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    const streak = await Streak.findOne({ userId });

    if (!streak) {
      return res.status(200).json({
        success: true,
        currentStreak: 0,
        maxStreak: 0,
      });
    }

    return res.status(200).json({
      success: true,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
    });
  } catch (error) {
    console.error("Failed to fetch streak:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching streak data",
    });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const pastYearDate = new Date();
    pastYearDate.setDate(today.getDate() - 364); // Include today + 364 days before

    const startDateStr = pastYearDate.toISOString().split("T")[0];

    // Get study sessions from past 365 days
    const sessions = await StudySession.find({
      userId,
      date: { $gte: startDateStr },
    });

    // Aggregate session data
    const dateMap = {};
    for (let session of sessions) {
      if (!dateMap[session.date]) dateMap[session.date] = 0;
      dateMap[session.date] += session.duration || 1; // or use 1 for binary heatmap
    }

    // Build full 365-day heatmap
    const heatmapData = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date(pastYearDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      heatmapData.push({
        date: dateStr,
        count: dateMap[dateStr] || 0,
      });
    }

    res.status(200).json({
      success: true,
      heatmap: heatmapData,
    });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate heatmap data",
    });
  }
};
