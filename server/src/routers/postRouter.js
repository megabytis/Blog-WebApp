const express = require("express");

const { userAuth } = require("../middleware/auth");
const { postModel } = require("../models/posts");
const { userModel } = require("../models/user");
const {
  validatePostData,
  validateUpdatePostData,
} = require("../utils/validate");

const postRouter = express.Router();

const SAFE_PROPERTIES_TO_DISPLAY = [
  "title",
  "content",
  "image",
  "likes",
  "author",
];

// ######
// POSTS
// ######

postRouter.post("/posts", userAuth, async (req, res, next) => {
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

postRouter.get("/posts", userAuth, async (req, res, next) => {
  try {
    let { page = 1, search, tags, minlikes, authorName, authorID } = req.query;

    // PAGINATION

    page = parseInt(req.query.page) || 1;

    const MAX_LIMIT = 3;
    let limit = parseInt(req.query.limit) || MAX_LIMIT;
    limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;

    const skip = (page - 1) * limit;

    const totalPosts = await postModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    if (page > totalPages && totalPages > 0) {
      throw new Error("Page is not Available!🤡");
    }

    // SEARCH Query

    const searchQuery = {};

    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Filtering by Author name, minimum likes & tags

    if (authorID) {
      searchQuery.author = authorID;
    }

    if (authorName) {
      const users = await userModel
        .find({
          name: { $regex: authorName, $options: "i" },
        })
        .select("_id");

      const userIDs = users.map((user) => user._id);

      searchQuery.author = { $in: userIDs };
    }

    if (minlikes) {
      searchQuery.likes = { $gte: parseInt(minlikes) };
    }

    if (tags) {
      const tagsArr = tags.split(",");
      searchQuery.tags = { $in: tagsArr };
    }

    const posts = await postModel
      .find(searchQuery)
      .populate("author", "name email")
      .select(SAFE_PROPERTIES_TO_DISPLAY.join(" "))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ message: "post", post: posts });
  } catch (err) {
    next(err);
  }
});

postRouter.get("/posts/:postID", userAuth, async (req, res, next) => {
  try {
    const postID = req.params?.postID;

    const foundPost = await postModel
      .findById(postID)
      .populate("author", "name email")
      .select(SAFE_PROPERTIES_TO_DISPLAY.join(" "));

    if (!foundPost) {
      throw new Error("Post Not Found!");
    }

    res.json({ message: "post", post: foundPost });
  } catch (err) {
    next(err);
  }
});

postRouter.patch("/posts/:postID", userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const postID = req.params?.postID;
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

postRouter.delete("/posts/:postID", userAuth, async (req, res, next) => {
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

// #########
// COMMENTS
// #########

postRouter.post("/posts/:postID/comments", userAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { postID } = req.params;
    const comments = req.body.comments;

    if (comments.length === 0) {
      throw new Error("Comment can't be Empty!");
    }

    if (postID.length === 0) {
      throw new Error("Invalid postID !");
    }

    const foundPost = await postModel
      .findByIdAndUpdate(
        postID,
        {
          $push: {
            comments: {
              user: user._id,
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
});

postRouter.get("/posts/:postID/comments", userAuth, async (req, res, next) => {
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

postRouter.delete(
  "/posts/:postID/comments/:commentID",
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

// ######
// LIKES
// ######

postRouter.patch("/post/:postID/like", userAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { postID } = req.params;

    if (postID.length === 0) {
      throw new Error("Invalid postID !");
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
          ? { $pull: { likes: user._id } }
          : { $push: { likes: user._id } },
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

postRouter.get(
  "/post/:postID/likes/count",
  userAuth,
  async (req, res, next) => {
    try {
      const { postID } = req.params;

      const foundPost = await postModel.findById(postID);
      if (!foundPost) {
        throw new Error("Post not found!");
      }

      res.json({ message: `Post has ${foundPost.likes.length} likes 🥰` });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = postRouter;
