import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { showToast } from "../utils/toast";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    loadPost();
    loadComments();
    loadLikeCount();
  }, [id]);

  const loadPost = async () => {
    try {
      const data = await api.get(`/posts/${id}`);
      setPost(data.post);
    } catch (err) {
      showToast(err.message, "error");
      navigate("/");
    }
  };

  const loadComments = async () => {
    try {
      const data = await api.get(`/posts/${id}/comments?page=1&limit=10`);
      setComments(data.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const loadLikeCount = async () => {
    try {
      const data = await api.get(`/posts/${id}/likes/count`);
      // Extract number from message or use direct count
      const count =
        typeof data === "object" ? data.message?.match(/\d+/)?.[0] || 0 : data;
      setLikeCount(parseInt(count) || 0);
    } catch (err) {
      console.error("Failed to load like count:", err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast("Please login to like posts", "warning");
      navigate("/login");
      return;
    }

    try {
      await api.patch(`/posts/${id}/like`);
      await loadLikeCount();
      showToast("Liked!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/posts/${id}/comments`, { comments: commentText });
      setCommentText("");
      await loadComments();
      showToast("Comment added!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      await loadComments();
      showToast("Comment deleted!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/posts/${id}`);
      showToast("Post deleted!", "success");
      navigate("/");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card text-center">
        <p>Post not found.</p>
      </div>
    );
  }

  const isPostOwner = user && post.author && user.email === post.author.email;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Post Content */}
      <div className="card mb-6">
        {isPostOwner && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              onClick={() => navigate(`/post/${id}/edit`)}
              className="btn btn-ghost btn-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDeletePost}
              className="btn btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        )}

        <h1 style={{ marginBottom: "0.5rem" }}>{post.title}</h1>
        <p className="card-meta">
          by {post.author?.name || post.author?.email}
        </p>

        {post.image && (
          <img
            src={post.image}
            alt="Post"
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              margin: "1rem 0",
            }}
          />
        )}

        {post.tags?.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            {post.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
          {post.content}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <button onClick={handleLike} className="btn btn-primary btn-sm">
            ❤ Like
          </button>
          <span>{likeCount} likes</span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Comments ({comments.length})</h3>

        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="form-group">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                required
                className="textarea"
                rows="3"
              />
            </div>
            <button
              type="submit"
              disabled={submittingComment}
              className="btn btn-primary btn-sm"
            >
              {submittingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p style={{ marginBottom: "1rem" }}>
            Please{" "}
            <button
              onClick={() => navigate("/login")}
              className="btn btn-ghost btn-sm"
              style={{ margin: "0 0.25rem" }}
            >
              login
            </button>{" "}
            to comment.
          </p>
        )}

        {/* Comments List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {comments.map((comment) => (
            <div key={comment._id} className="card">
              <p style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>
                {comment.text}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  by {comment.user?.name || comment.user?.email || "User"}
                </span>
                {user && comment.user && user.email === comment.user.email && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
