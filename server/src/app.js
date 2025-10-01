const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

// Import your routers
const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

// --- Config ---
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
const allowedOrigins = [
  "https://blog-web-app-eight-olive.vercel.app",
  "http://localhost:3000",
];

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin
    }`
  );
  next();
});

// --- Routes ---
app.use("/auth", authRouter);
app.use("/posts", postRouter);

// --- DB connection ---
const { connectDB } = require("./config/database");
connectDB()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection error:", err));

// --- Root endpoint ---
app.get("/", (req, res) => res.send("Blog API is running"));

// --- Health check ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    allowedOrigins: allowedOrigins,
  });
});

// --- Start server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${allowedOrigins.join(", ")}`);
  console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});
