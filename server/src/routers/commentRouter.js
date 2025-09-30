const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");

const commentRouter = express.Router();

commentRouter.post(
  "/comments/:userID/:postID",
  userAuth,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { userID, postID } = req.params;
      const comments = req.body.comments;

      if (comments.length === 0) {
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
                text: comments,
              },
            },
          },
          { new: true }
        )
        .populate("comments.user", "name email");

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

commentRouter.get("/comments/:postID", userAuth, async (req, res, next) => {
  try {
    const postID = req.params.postID;

    if (!postID) {
      throw new Error("Invalid Post ID!");
    }

    const page = parseInt(req.query.page) || 1;

    const MAX_LIMIT = 3;
    let limit = parseInt(req.query.limit) || MAX_LIMIT;
    limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;

    const skip = (page - 1) * limit;

    const foundPost = await postModel.findById(postID).select("comments");

    if (!foundPost) {
      throw new Error("Post not Found!");
    }

    const totalComments = foundPost.comments.length;
    const totalPages = Math.ceil(totalComments / limit);

    const paginatedComments = foundPost.comments.slice(skip, skip + limit);

    res.json({
      message: "Comments",
      data: paginatedComments,
      pagination: {
        page,
        limit,
        totalComments,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

commentRouter.delete(
  "/comments/:postID/deletecomments/:commentID",
  userAuth,
  async (req, res, next) => {
    try {
      const { postID, commentID } = req.params;
      const loggedInUser = req.user;

      const post = await postModel.findById(postID);
      if (!post) {
        throw new Error("Post not Found!");
      }

      const foundComment = post.comments.find(
        (c) => c._id.toString() === commentID.toString()
      );
      if (!foundComment) {
        throw new Error("Comment Not found!");
      }

      if (foundComment.user.toString() !== loggedInUser._id.toString()) {
        throw new Error("User not Authorized!");
      }

      post.comments = post.comments.filter(
        (comment) => comment._id.toString() !== commentID.toString()
      );

      await post.save();

      res.json({ message: "Comment Deleted!", data: post.comments });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = commentRouter;
