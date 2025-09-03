const axios = require("axios");
const Session = require("../models/StudySession");
const AIInsights = require("../models/AIInsights");

// Calculate Monday and Sunday of the given date
function getWeekRange(date) {
  const inputDate = new Date(date);
  const day = inputDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const monday = new Date(inputDate);
  monday.setDate(inputDate.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d) => d.toISOString().split("T")[0];
  return { weekStart: format(monday), weekEnd: format(sunday) };
}

exports.generateWeeklyAIInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const { weekStart, weekEnd } = getWeekRange(today);

    // If already generated for this week, return it
    const alreadyExists = await AIInsights.findOne({
      userId,
      weekStart,
      weekEnd,
    });
    if (alreadyExists) {
      return res.status(409).json({
        message: "Insights already generated for this week",
        insights: alreadyExists,
      });
    }

    // Get current week's sessions
    const currentSessions = await Session.find({
      userId,
      date: { $gte: weekStart, $lte: weekEnd },
    }).populate("subjectId", "name");

    const formatSession = (session) => {
      const subjectName = session.subjectId?.name || "Unknown Subject";
      const dateObject = new Date(session.date);
      const mins = session.duration ?? session.minutes ?? 0; // tolerate either field
      return `On ${
        dateObject.toISOString().split("T")[0]
      }, studied ${subjectName} for ${mins} minutes.`;
    };

    // Text for Gemini whether or not sessions exist
    const currentWeekText =
      currentSessions.length > 0
        ? currentSessions.map(formatSession).join(" ")
        : "No study sessions were recorded this week.";

    // Last week window
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const prevWeekStart = lastWeekStart.toISOString().split("T")[0];
    const prevWeekEnd = lastWeekEnd.toISOString().split("T")[0];

    const lastWeekSessions = await Session.find({
      userId,
      date: { $gte: prevWeekStart, $lte: prevWeekEnd },
    }).populate("subjectId", "name");

    const lastWeekText =
      lastWeekSessions.length > 0
        ? lastWeekSessions.map(formatSession).join(" ")
        : "No study sessions were recorded last week.";

    const prompt = `
You are a helpful study coach AI. Analyze the user's study progress and provide a JSON object with the keys: "feedback", "motivation", "risks", and "comparison".

- feedback: Short, constructive feedback. If there were no sessions this week, give a gentle nudge focused on starting small (e.g., 20–25 minutes).
- motivation: An encouraging, motivational message that works even for a zero-activity week.
- risks: Brief list of potential risk areas (e.g., consistency, routine, skipped subjects).
- comparison: Concise comparison with the previous week's performance. If both weeks are empty, say so and emphasize a fresh start.

Current Week's Sessions:
${currentWeekText}

Previous Week's Sessions:
${lastWeekText}

Respond with only the raw JSON object, without any surrounding text or markdown.
`;

    const geminiApiKey = process.env.GeminiAPI_KEY;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    const rawResponse =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawResponse) {
      console.error("Failed to parse response from Gemini API:", response.data);
      return res
        .status(500)
        .json({ error: "Could not parse the response from the AI model." });
    }

    const cleanedResponse = rawResponse.replace(/```json\n|```/g, "").trim();
    const parsedInsights = JSON.parse(cleanedResponse);

    const riskAreasAsString = Array.isArray(parsedInsights.risks)
      ? parsedInsights.risks.join("\n• ")
      : parsedInsights.risks;

    const newInsight = await AIInsights.create({
      userId,
      weekStart,
      weekEnd,
      feedbackText: parsedInsights.feedback,
      motivationalText: parsedInsights.motivation,
      riskAreas: riskAreasAsString,
      comparisonWithLastWeek: parsedInsights.comparison,
    });

    res
      .status(201)
      .json({
        message: "AI insights generated successfully",
        insights: newInsight,
      });
  } catch (error) {
    console.error("--- ERROR GENERATING INSIGHTS ---");
    if (error.response) {
      console.error("Axios Error Data:", error.response.data);
      console.error("Axios Error Status:", error.response.status);
    } else {
      console.error("Full Error Object:", error);
    }
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
};

exports.getWeeklyInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const { weekStart, weekEnd } = getWeekRange(today);

    const insights = await AIInsights.findOne({ userId, weekStart, weekEnd });

    if (!insights) {
      // Fallback : always return *something* motivational
      const fallback = {
        weekStart,
        weekEnd,
        feedbackText:
          "No study logs yet this week — start with one short, focused 25-minute session. Getting started is the hardest part!",
        motivationalText:
          "Every streak starts at 1. Open your timer, pick one subject, and do 25 minutes. You’ve got this 💪",
        riskAreas:
          "Inconsistency • No defined study slot • Over-planning without action",
        comparisonWithLastWeek:
          "No recorded activity to compare. Treat this as a fresh start.",
      };
      return res
        .status(200)
        .json({ success: true, insights: fallback, fallback: true });
    }

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ message: "Server error while fetching insights" });
  }
};
