const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/authMiddleware");
const { logStudySession,getDailyProgress,getWeeklyProgress,getMonthlyProgress} = require("../controllers/sessionController");

router.post("/log", auth, logStudySession);
router.get("/daily", auth, getDailyProgress);
router.get("/weekly", auth, getWeeklyProgress);
router.get("/monthly", auth, getMonthlyProgress);

module.exports = router;
