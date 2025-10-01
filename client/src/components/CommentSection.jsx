import React, { useState, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import { commentAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const response = await commentAPI.getComments(postId, { limit: 50 });
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const response = await commentAPI.addComment(postId, {
        content: newComment,
      });
      setComments((prev) => [response.data.comment, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await commentAPI.deleteComment(postId, commentId);
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Comments ({comments.length})
      </h3>

      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">
                  {comment.author?.name || "Anonymous"}
                </p>
                <p className="text-gray-600 mt-1">{comment.content}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Show delete button if user is the author */}
              {user && comment.author?._id === user._id && (
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
