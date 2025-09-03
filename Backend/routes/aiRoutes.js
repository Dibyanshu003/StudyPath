const express = require("express");
const router = express.Router();
const { generateWeeklyAIInsights ,getWeeklyInsights} = require("../controllers/aiController");
const { auth } = require("../middleware/authMiddleware");

router.post("/generate", auth, generateWeeklyAIInsights);
router.get("/insights", auth, getWeeklyInsights);

module.exports = router;
