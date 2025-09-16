
// const mongoose = require("mongoose");

// const dbConnect = () => {
//   mongoose.connect(process.env.MONGODB_URL)
//   .then(() => console.log("DB connection successful"))
//   .catch((error) => {
//     console.log("DB connection failed");
//     console.error(error);
//     process.exit(1);
//   });
// };

// module.exports = dbConnect;
const mongoose = require("mongoose");

const dbConnect = () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    console.error(
      "❌ MONGODB_URL is missing. Set it in environment variables."
    );
    process.exit(1);
  }

  // Optional: small log to confirm host (no secrets)
  try {
    const u = new URL(uri);
    console.log(
      `🔌 Connecting to MongoDB host: ${u.hostname}, db: ${
        u.pathname.slice(1) || "(default)"
      }`
    );
  } catch (e) {
    console.error("❌ MONGODB_URL is not a valid URL.");
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => console.log("✅ DB connection successful"))
    .catch((error) => {
      console.error("❌ DB connection failed:", error.message);
      process.exit(1);
    });
};

module.exports = dbConnect;
