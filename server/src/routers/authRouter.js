const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validateSignupData } = require("../utils/validate");
const { userModel } = require("../models/user");

const authRouter = express.Router();

authRouter.post("/auth/signup", async (req, res, next) => {
  try {
    console.log("🔍 SIGNUP REQUEST RECEIVED");
    console.log("🔍 Request body:", req.body);

    const { name, email, password, bio } = req.body;

    // Check if required fields exist
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      throw new Error("Name, email, and password are required");
    }

    console.log("🔍 Starting validation...");
    validateSignupData(req);
    console.log("🔍 Validation passed");

    console.log("🔍 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔍 Password hashed");

    console.log("🔍 Creating user model...");
    const user = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
      bio: bio,
    });

    console.log("🔍 Saving user to database...");
    const newUser = await user.save();
    console.log("✅ User saved successfully:", newUser._id);

    res.json({
      message: `User added successfully`,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
      },
    });
  } catch (err) {
    console.error("🔥 SIGNUP ERROR:", err.message);
    console.error("🔥 ERROR DETAILS:", err);
    next(err);
  }
});

authRouter.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const foundUserData = await userModel.findOne({ email: email });
    if (!foundUserData) {
      throw new Error("Invalid Credential!");
    }

    const isPasswordSame = await bcrypt.compare(
      password,
      foundUserData.password
    );

    if (isPasswordSame) {
      const token = jwt.sign(
        { _id: foundUserData._id },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login Successful",
      });
    } else {
      throw new Error("Invalid Credential");
    }
  } catch (err) {
    next(err);
  }
});

// FIXED: Remove "/auth" prefix
authRouter.post("/auth/logout", (req, res, next) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logout Successful!" });
});

module.exports = authRouter;
