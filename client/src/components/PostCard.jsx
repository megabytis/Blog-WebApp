import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Calendar } from "lucide-react";
import { postAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    try {
      await postAPI.likePost(post._id);
      setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link to={`/post/${post._id}`}>
            <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
              {post.title}
            </h2>
          </Link>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>By {post.author?.name || "Unknown"}</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart
              className="h-4 w-4"
              fill={isLiked ? "currentColor" : "none"}
            />
            <span>{likes}</span>
          </button>
          <div className="flex items-center space-x-1 text-gray-500">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentsCount || 0}</span>
          </div>
        </div>

        <Link
          to={`/post/${post._id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Read more →
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
