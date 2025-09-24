const express = require("express");

const { connectDB } = require("./config/database");

const authRouter = require("./routers/authRouter");

const app = express();
app.use(express.json());

app.use("/", authRouter);

// Global ERRROR HANDLER
app.use((err, req, res) => {
  res.json({ message: `ERRRO: ${err.message}` });
});

connectDB()
  .then(() => console.log("MongoDB connected"))
  .then(() => {
    app.listen(3000, () =>
      console.log("Server running on http://localhost:3000")
    );
  })
  .catch((err) => console.error(err));
