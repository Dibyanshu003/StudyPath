// cron/reminderJob.js
const cron = require("node-cron");
const Session = require("../models/StudySession");
const User = require("../models/Users");
const mailSender = require("../utils/mailSender");
const moment = require("moment");

cron.schedule("0 20 * * *", async () => {
  const today = moment().format("YYYY-MM-DD");

  try {
    const users = await User.find({ dailyReminder: true });

    for (const user of users) {
      const session = await Session.findOne({
        userId: user._id,
        date: today,
      });

      if (!session) {
        await mailSender(
          user.email,
          "Study Reminder: You Haven’t Studied Today",
          `Hi ${user.name},\n\nJust a gentle reminder that you haven't logged any study session today.\nStay consistent and keep going!\n\n- Study Tracker`
        );
      }
    }

    console.log("Reminder emails sent at 8 PM");
  } catch (error) {
    console.error("Error sending reminders:", error.message);
  }
});
