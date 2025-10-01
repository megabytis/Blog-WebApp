const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

const app = express();

// NUCLEAR CORS FIX - Remove cors package, do it manually
app.use((req, res, next) => {
  // Allow all origins for now (you can restrict later)
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    console.log("OPTIONS preflight handled for:", req.path);
    return res.status(200).end();
  }

  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());
app.use(cookieParser());

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRouter);
app.use("/posts", postRouter);

const { connectDB } = require("./config/database");
connectDB()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection error:", err));

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running with nuclear CORS fix");
});
