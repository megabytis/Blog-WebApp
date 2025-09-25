const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");

const postRouter = express.Router();

postRouter.post("/post/create", userAuth, async (req, res, next) => {
  try {
    const { title, content, image, tags } = req.body;

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

module.exports = postRouter;
