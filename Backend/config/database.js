

const mongoose = require("mongoose");

const dbConnect = () => {
  mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("DB connection successful"))
  .catch((error) => {
    console.log("DB connection failed");
    console.error(error);
    process.exit(1);
  });
};

module.exports = dbConnect;