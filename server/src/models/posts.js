const { default: mongoose } = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "user" },
        text: { type: String },
        createdAt: { type: Date, default: Date.now() },
        updatedAt: { type: Date, default: Date.now() },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const postModel = mongoose.model("post", postSchema);

module.exports = {
  postModel,
};
