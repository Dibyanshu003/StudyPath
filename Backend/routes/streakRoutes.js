const express = require("express");
const router = express.Router();

const { getStreak,getHeatmapData } = require("../controllers/streakController");
const { auth } = require("../middleware/authMiddleware");

router.get("/", auth, getStreak);
router.get("/heatmap",auth,getHeatmapData);
module.exports = router;
