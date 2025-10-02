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

  useEffect(() => {
    fetchPostData();
  }, [id]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/posts/${id}/comments?page=1&limit=20`),
      ]);

      setPost(postData.post);
      setComments(commentsData.data || []);
    } catch (err) {
      showToast("Failed to load post", "error");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast("Please login to like posts", "warning");
      return;
    }

    try {
      await api.patch(`/posts/${id}/like`);
      showToast("Liked!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isAuthenticated) {
      showToast("Please login to comment", "warning");
      return;
    }

    setSubmittingComment(true);
    try {
      await api.post(`/posts/${id}/comments`, { comments: commentText });
      setCommentText("");
      await fetchPostData();
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
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
      showToast("Comment deleted!", "success");
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
      <div className="card mb-6">
        {isPostOwner && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              onClick={() => navigate(`/posts/${id}/edit`)}
              className="btn btn-ghost btn-sm"
            >
              Edit
            </button>
          </div>
        )}

        <h1>{post.title}</h1>
        <p className="card-meta">
          by {post.author?.name || post.author?.email}
        </p>

        {post.image && (
          <img
            src={post.image}
            alt="Post"
            style={{ maxWidth: "100%", margin: "1rem 0" }}
          />
        )}

        <div style={{ whiteSpace: "pre-wrap" }}>{post.content}</div>

        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleLike} className="btn btn-primary btn-sm">
            ❤ Like
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Comments ({comments.length})</h3>

        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="textarea"
              rows="3"
            />
            <button
              type="submit"
              disabled={submittingComment}
              className="btn btn-primary btn-sm"
            >
              {submittingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p>Please login to comment.</p>
        )}

        {comments.map((comment) => (
          <div key={comment._id} className="card">
            <p>{comment.text}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>by {comment.user?.name || comment.user?.email}</span>
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
      </div>
    </div>
  );
}
