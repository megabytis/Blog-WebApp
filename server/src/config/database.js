// -------------------
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔍 Attempting to connect to MongoDB...");
    console.log(
      "🔍 Connection string:",
      process.env.MONGO_CONNECTION_STRING ? "Exists" : "Missing"
    );

    const conn = await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);
  } catch (err) {
    console.error("🔥 Database connection error:", err.message);
    throw err;
  }
};

module.exports = { connectDB };
