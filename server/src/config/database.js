// -------------------
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
  } catch (err) {
    throw err;
  }
};

module.exports = { connectDB };
