// index.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

// Import your routers
const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

// --- Config ---
const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = "https://blog-web-app-eight-olive.vercel.app"; // exact frontend URL

// --- CORS setup ---
const allowedOrigins = [FRONTEND_URL];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server (Postman)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // allow cookies
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use("/auth", authRouter);
app.use("/posts", postRouter);

// --- DB connection (example) ---
const { connectDB } = require("./config/database");
connectDB()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection error:", err));

// --- Root endpoint ---
app.get("/", (req, res) => res.send("Blog API is running"));

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
