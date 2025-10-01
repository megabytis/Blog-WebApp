const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

const app = express();

// CORS middleware
app.use(
  cors({
    origin: ["https://blog-web-app-eight-olive.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", (req, res) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://blog-web-app-eight-olive.vercel.app"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", postRouter);

const { connectDB } = require("./config/database");
connectDB()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection error:", err));
