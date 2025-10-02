const userAuth = async (req, res, next) => {
  try {
    console.log(`🔍 userAuth middleware called for: ${req.method} ${req.path}`);
    console.log(`🔍 Cookies:`, req.cookies);

    const { token } = req.cookies;

    if (!token) {
      console.log(`❌ No token found for: ${req.path}`);
      throw new Error("Token not valid!");
    }

    const foundUserObject = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { _id } = foundUserObject;

    const foundUser = await userModel.findById(_id);

    if (!foundUser) {
      throw new Error("User not found!");
    }

    req.user = foundUser;
    console.log(`✅ Auth successful for: ${req.path}`);
    next();
  } catch (err) {
    console.log(`🔥 Auth failed for ${req.path}:`, err.message);
    next(err);
  }
};

module.exports = {
  userAuth,
};
