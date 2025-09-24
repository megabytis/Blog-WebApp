const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error(`Email Not Valid ${value}`);
        }
      },
    },
    password: {
      type: String,
      unique: true,
      required: true,
      validate(pass) {
        if (!validator.isStrongPassword(pass)) {
          throw new Error(`Not a Strong Password: ${pass}`);
        }
      },
    },
  },
  { timestamps: true }
);

module.exports = {
  userSchema,
};
