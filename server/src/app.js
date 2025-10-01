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
    origin: [""],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    // allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", postRouter);

// Global ERRROR HANDLER
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ success: false, message: `ERROR: ${err.message}` });
});

connectDB()
  .then(() => console.log("MongoDB connected"))
  .then(() => {
    app.listen(3000, () => console.log("Server is running"));
  })
  .catch((err) => console.error(err));
