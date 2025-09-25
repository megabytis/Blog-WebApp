const validator = require("validator");

const validateSignupData = (req) => {
  const { name, email, password } = req.body;

  if (!name) {
    throw new Error("Name not valid!");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email not valid!");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not Strong!");
  }
};

const validatePostData = (req) => {
  const { title, content, image, tags } = req.body;

  if (!title) {
    throw new Error("Title now valid!");
  } else if (!content) {
    throw new Error("Content not valid!");
  } else if (!validator.isURL(image)) {
    throw new Error("Not a Valid image URL!");
  } else if (validator.isEmpty(tags)) {
    throw new Error("Tags shouldn't be empty!");
  }
};

module.exports = {
  validateSignupData,
};
