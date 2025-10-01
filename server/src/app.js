const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./config/database");

const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");

const app = express();

require("dotenv").config();

const allowedOrigins = ["https://blog-web-app-eight-olive.vercel.app"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server or Postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
