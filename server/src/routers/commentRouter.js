const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");

const commentRouter = express.Router();

commentRouter.post(
  "/comment/:userID/:postID",
  userAuth,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { userID, postID } = req.params;
      const comment = req.body.comment;

      if (comment.length === 0) {
        throw new Error("Comment can't be Empty!");
      }

      if (userID.length === 0 || postID.length === 0) {
        throw new Error("Invalid userID or postID !");
      }

      if (user._id.toString() !== userID.toString()) {
        throw new Error("Invalid userID!");
      }

      const foundPost = await postModel
        .findByIdAndUpdate(
          postID,
          {
            $push: {
              comments: {
                user: userID,
                text: comment,
              },
            },
          },
          { new: true }
        )
        .populate("comment.user", "name email");

      if (!foundPost) {
        throw new Error("Post not found!");
      }

      res.json({
        message: `${user.name} commented on Post!`,
        data: foundPost.comments,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = commentRouter;
