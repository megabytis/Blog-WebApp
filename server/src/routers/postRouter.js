const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");
const { userModel } = require("../models/user");
const {
  validatePostData,
  validateUpdatePostData,
} = require("../utils/validate");

const postRouter = express.Router();

postRouter.post("/post/create", userAuth, async (req, res, next) => {
  try {
    const { title, content, image, tags } = req.body;

    validatePostData(req);

    const Post = new postModel({
      title: title,
      content: content,
      image: image,
      tags: tags,
      author: req.user._id,
    });

    const isThereAnySameTitledPost = await postModel.findOne({
      author: req.user._id,
      title: title,
    });

    if (isThereAnySameTitledPost) {
      throw new Error("Same titled Post already Exsists!");
    }

    const savedPost = await Post.save();

    res.json({ message: "Post saved Successfully!", data: savedPost });
  } catch (err) {
    next(err);
  }
});

postRouter.patch("/post/update/:postID", userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const postID = req.params?.postID;
    const dataUserWannaModify = req.body;
    const ALLOWED_FIELDS_TO_UPDATE = ["title", "content", "tags", "image"];

    validateUpdatePostData(req);

    const foundPost = await postModel.findById(postID);

    if (foundPost === null) {
      throw new Error("Post not Found!");
    }

    if (foundPost.author.toString() !== loggedInUser._id.toString()) {
      throw new Error("You are not Authorized to Update the Post!");
    }

    ALLOWED_FIELDS_TO_UPDATE.forEach((field) => {
      if (field in req.body) {
        foundPost[field] = req.body[field];
      }
    });

    const updatedPost = await foundPost.save();

    res.json({
      message: `Dear ${loggedInUser.name}, your Post has been updated Successfully!`,
      data: foundPost,
    });
  } catch (err) {
    next(err);
  }
});

postRouter.post("/post/delete/:postID", userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const postID = req.params?.postID;

    const foundPost = await postModel.findById(postID);

    if (foundPost === null) {
      throw new Error("Post not Found!");
    }

    if (foundPost.author.toString() !== loggedInUser._id.toString()) {
      throw new Error("You are not Authorized to Delete the Post!");
    }

    await postModel.deleteOne({ _id: postID });

    res.json({ message: "Post deleted Successfully!" });
  } catch (err) {
    next(err);
  }
});

postRouter.get("/post/:postID", userAuth, async (req, res, next) => {
  try {
    const postID = req.params?.postID;
    const SAFE_PROPERTIES_TO_DISPLAY = [
      "title",
      "content",
      "image",
      "likes",
      "author",
    ];

    const foundPost = await postModel
      .findById(postID)
      .populate("author", "name email");

    const postToDisplay = {};
    SAFE_PROPERTIES_TO_DISPLAY.forEach((key) => {
      if (foundPost[key] !== undefined) {
        postToDisplay[key] = foundPost[key];
      }
    });

    res.json({ message: "post", post: postToDisplay });
  } catch (err) {
    next(err);
  }
});

postRouter.get("/post/all", userAuth, (req, res, next) => {
  
});

module.exports = postRouter;
