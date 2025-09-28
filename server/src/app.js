const express = require("express");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/database");

const authRouter = require("./routers/authRouter");
const postRouter = require("./routers/postRouter");
const commentRouter = require("./routers/commentRouter");
const likesRouter = require("./routers/likesRoutes");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", postRouter);
app.use("/", commentRouter);
app.use("/", likesRouter);

// Global ERRROR HANDLER
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ success: false, message: `ERROR: ${err.message}` });
});

connectDB()
  .then(() => console.log("MongoDB connected"))
  .then(() => {
    app.listen(3000, () =>
      console.log("Server running on http://localhost:3000")
    );
  })
  .catch((err) => console.error(err));
