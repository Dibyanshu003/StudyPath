const StudySession = require("../models/StudySession");
const Subject = require("../models/Subject");
const Streak = require("../models/Streak");

exports.logStudySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      subjectId,
      duration = 0,
      questionsSolved = 0,
      startTime,
      endTime,
      notes,
    } = req.body;

    if (!subjectId || (duration === 0 && questionsSolved === 0)) {
      return res.status(400).json({
        success: false,
        message: "Subject and either duration or questions solved is required",
      });
    }

    const date = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Check if session already exists for same user + subject + date
    let existingSession = await StudySession.findOne({
      userId,
      subjectId,
      date,
    });

    if (existingSession) {
      // Update existing session
      existingSession.duration += duration;
      existingSession.questionsSolved += questionsSolved;

      if (startTime) existingSession.startTime = startTime;
      if (endTime) existingSession.endTime = endTime;
      if (notes) existingSession.notes = notes;

      await existingSession.save();

      return res.status(200).json({
        success: true,
        message: "Study session updated successfully",
        session: existingSession,
      });
    }

    // If no session exists, create a new one
    const newSession = await StudySession.create({
      userId,
      subjectId,
      date,
      duration,
      questionsSolved,
      startTime,
      endTime,
      notes,
    });

    let streak = await Streak.findOne({ userId });
    const today = date;

    if (!streak) {
      // First-time streak
      await Streak.create({
        userId,
        currentStreak: 1,
        maxStreak: 1,
        lastStudyDate: today,
      });
    } else {
      const lastDate = streak.lastStudyDate;
      if (lastDate === today) {
        // Already updated today → no need to modify streak
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastDate === yesterdayStr) {
          // Continue streak
          streak.currentStreak += 1;
        } else {
          // Missed a day → reset streak
          streak.currentStreak = 1;
        }

        // Update max streak if needed
        if (streak.currentStreak > streak.maxStreak) {
          streak.maxStreak = streak.currentStreak;
        }

        // Update lastStudyDate
        streak.lastStudyDate = today;
        await streak.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Study session logged successfully",
      session: newSession,
    });
  } catch (error) {
    console.error("Error logging study session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log study session",
    });
  }
};

exports.getDailyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // Get all today's sessions for the user and populate subject data
    const sessions = await StudySession.find({ userId, date: today }).populate(
      "subjectId"
    );

    const responseData = [];

    for (let session of sessions) {
      const subject = session.subjectId;
      if (!subject) continue;

      const subjectData = {
        subjectName: subject.name,
        trackingType: subject.trackingType,
        colorCode: subject.colorCode,
        completedMinutes: session.duration || 0,
        completedQuestions: session.questionsSolved || 0,
        targetMinutes:
          subject.trackingType !== "questions"
            ? subject.targetPerDayMinutes
            : null,
        targetQuestions:
          subject.trackingType !== "time"
            ? subject.targetPerDayQuestions
            : null,
      };

      responseData.push(subjectData);
    }

    return res.status(200).json({
      success: true,
      date: today,
      progress: responseData,
    });
  } catch (error) {
    console.error("Error in getDailyProgress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily progress",
    });
  }
};

// helper function
const getDateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

exports.getWeeklyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = getDateNDaysAgo(7);

    const sessions = await StudySession.find({
      userId,
      date: { $gte: startDate },
    });

    // Group by subject
    const subjectMap = new Map();

    for (let session of sessions) {
      const subjectId = session.subjectId.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          completedMinutes: 0,
          completedQuestions: 0,
        });
      }
      const data = subjectMap.get(subjectId);
      data.completedMinutes += session.duration || 0;
      data.completedQuestions += session.questionsSolved || 0;
    }

    // Fetch subject details
    const result = [];
    for (let [subjectId, progress] of subjectMap.entries()) {
      const subject = await Subject.findById(subjectId);
      if (!subject) continue;

      result.push({
        subjectName: subject.name,
        trackingType: subject.trackingType,
        colorCode: subject.colorCode,
        completedMinutes: progress.completedMinutes,
        completedQuestions: progress.completedQuestions,
        targetPerDayMinutes: subject.targetPerDayMinutes,
        targetPerDayQuestions: subject.targetPerDayQuestions,
        expectedMinutes: subject.targetPerDayMinutes
          ? subject.targetPerDayMinutes * 7
          : null,
        expectedQuestions: subject.targetPerDayQuestions
          ? subject.targetPerDayQuestions * 7
          : null,
      });
    }

    return res.status(200).json({
      success: true,
      duration: "weekly",
      progress: result,
    });
  } catch (error) {
    console.error("Weekly progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly progress",
    });
  }
};

exports.getMonthlyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = getDateNDaysAgo(30);

    const sessions = await StudySession.find({
      userId,
      date: { $gte: startDate },
    });

    // Same grouping logic as weekly
    const subjectMap = new Map();

    for (let session of sessions) {
      const subjectId = session.subjectId.toString();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          completedMinutes: 0,
          completedQuestions: 0,
        });
      }
      const data = subjectMap.get(subjectId);
      data.completedMinutes += session.duration || 0;
      data.completedQuestions += session.questionsSolved || 0;
    }

    const result = [];
    for (let [subjectId, progress] of subjectMap.entries()) {
      const subject = await Subject.findById(subjectId);
      if (!subject) continue;

      result.push({
        subjectName: subject.name,
        trackingType: subject.trackingType,
        colorCode: subject.colorCode,
        completedMinutes: progress.completedMinutes,
        completedQuestions: progress.completedQuestions,
        targetPerDayMinutes: subject.targetPerDayMinutes,
        targetPerDayQuestions: subject.targetPerDayQuestions,
        expectedMinutes: subject.targetPerDayMinutes
          ? subject.targetPerDayMinutes * 30
          : null,
        expectedQuestions: subject.targetPerDayQuestions
          ? subject.targetPerDayQuestions * 30
          : null,
      });
    }

    return res.status(200).json({
      success: true,
      duration: "monthly",
      progress: result,
    });
  } catch (error) {
    console.error("Monthly progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly progress",
    });
  }
};
