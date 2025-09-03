// utils/mailSender.js
const nodemailer = require("nodemailer");
require("dotenv").config(); 

const mailSender = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: "StudyPath <" + process.env.MAIL_USER + ">",
      to: email,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(` Mail sent to ${email}`);
  } catch (error) {
    console.error("Mail sending error:", error.message);
    throw error;
  }
};

module.exports = mailSender;
