const express = require("express");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/database");

const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const goalRoutes = require("./routes/goalRoutes");
const streakRoutes = require("./routes/streakRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const aiRoutes = require("./routes/aiRoutes");

require("dotenv").config();
const app = express();

// load config from env File
const PORT = process.env.PORT || 5000;

// connect to database
dbConnect();

// middleware to parse JSON body
app.use(express.json());
app.use(cookieParser());

// Allow CORS 
const cors = require("cors");

const allowed = [
  "http://localhost:3000", // keep if you sometimes open frontend on 3000
  "http://localhost:3001",
  "http://localhost:5173", // vite default, handy if you switch
  "https://study-path-five.vercel.app"
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true); // allow Postman/no-origin
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// mount user routes
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/ai", aiRoutes);

// server.js 
require("./cron/reminderJob");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
