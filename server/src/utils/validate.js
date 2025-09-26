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
  } else if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error("Tags shouldn't be empty!");
  }
};

const validateUpdatePostData = (req) => {
  const postDataUserWannaModify = req.body;
  const ALLOWED_FIELDS_TO_UPDATE = ["title", "content", "tags", "image"];

  const isUpdateAllowed = Object.keys(postDataUserWannaModify).every((key) =>
    ALLOWED_FIELDS_TO_UPDATE.includes(key)
  );

  if (!isUpdateAllowed) {
    throw new Error("Invalid Fields for Update!");
  }
};

module.exports = {
  validateSignupData,
  validatePostData,
  validateUpdatePostData,
};
