const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./config/database");

const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

const app = express();

require("dotenv").config();

app.use(
  cors({
    // origin: ["https://blog-webapp-ui.onrender.com"], // array, not string
    // methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`🚨 APP.JS - Incoming: ${req.method} ${req.originalUrl}`);
  console.log(`🚨 APP.JS - Path: ${req.path}`);
  next();
});

// ✅ SIMPLE health check - no dependencies
app.get("/health", (req, res) => {
  console.log("✅ Health check hit!");
  res.json({ status: "OK", message: "Server is running" });
});

// ✅ SIMPLE test route
app.get("/simple-test", (req, res) => {
  console.log("✅ Simple test hit!");
  res.json({ message: "Simple test works!" });
});

// ✅ Router prefixes
app.use("/", postRouter);
app.use("/", authRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error middleware:", err.message);
  res.status(err.statusCode || 500).json({ message: `ERROR: ${err.message}` });
});

// DB + start server
connectDB()
  .then(() => {
    console.log("✅ DB connected to app");
    app.listen(8080, () => {
      console.log("🚀 App is listening on port 8080");
    });
  })
  .catch((err) => console.log("DB connection error:", err));
