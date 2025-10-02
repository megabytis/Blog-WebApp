const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validateSignupData } = require("../utils/validate");
const { userModel } = require("../models/user");

const authRouter = express.Router();

authRouter.post("/auth/signup", async (req, res, next) => {
  try {
    const { name, email, password, bio } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
      bio: bio,
    });

    const newUser = await user.save();

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
        user: {
          _id: foundUserData._id,
          name: foundUserData.name,
          email: foundUserData.email,
          bio: foundUserData.bio,
        },
      });
    } else {
      throw new Error("Invalid Credential");
    }
  } catch (err) {
    next(err);
  }
});

authRouter.post("/auth/logout", (req, res, next) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logout Successful!" });
});

module.exports = authRouter;
