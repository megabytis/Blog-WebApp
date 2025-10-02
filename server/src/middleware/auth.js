const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Token not valid!");
    }

    const foundUserObject = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { _id } = foundUserObject;

    const foundUser = await userModel.findById(_id);

    if (!foundUser) {
      throw new Error("User not found!");
    }

    req.user = foundUser;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  userAuth,
};
