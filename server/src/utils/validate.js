const validator = require("validator");

const validateSignupData = (req) => {
  const { name, email, password } = req.body;

  if (!name) {
    throw new Error("Name not valid!");
  }
  if (!validator.isEmail(email)) {
    throw new Error("Email not valid!");
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not Strong!");
  }
};

module.exports = {
  validateSignupData,
};
