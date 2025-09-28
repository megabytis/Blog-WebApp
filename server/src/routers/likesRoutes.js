const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");

const likesRouter = express.Router();

likesRouter.patch("/like/:userID/:postID", userAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { userID, postID } = req.params;

    if (userID.length === 0 || postID.length === 0) {
      throw new Error("Invalid userID or postID !");
    }

    if (user._id.toString() !== userID.toString()) {
      throw new Error("Invalid userID!");
    }

    const foundPost = await postModel.findById(postID);

    if (!foundPost) {
      throw new Error("Post not found!");
    }

    let alreadyLiked = false;

    for (id of foundPost.likes) {
      if (id.toString() === userID.toString()) {
        alreadyLiked = true;
        break;
      }
    }

    const updatedPost = await postModel
      .findByIdAndUpdate(
        postID,
        alreadyLiked
          ? { $pull: { likes: userID } }
          : { $push: { likes: userID } },
        { new: true }
      )
      .populate("likes", "name email");

    const resMessage = alreadyLiked ? "disliked" : "liked";

    res.json({
      message: `${user.name} ${resMessage} the post!`,
      data: updatedPost,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = likesRouter;
