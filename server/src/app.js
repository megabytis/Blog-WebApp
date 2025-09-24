const express = require("express");

const { connectDB } = require("./config/database");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "hello blog!",
  });
});

// connect to Mongo
connectDB()
  .then(() => console.log("MongoDB connected"))
  .then(() => {
    app.listen(3000, () =>
      console.log("Server running on http://localhost:3000")
    );
  })
  .catch((err) => console.error(err));
