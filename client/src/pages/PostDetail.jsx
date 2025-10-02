import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { showToast } from "../utils/toast";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Single data fetching function
  const fetchPostData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch all data in parallel for better performance
      const [postData, commentsData, likeData] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/posts/${id}/comments?page=1&limit=20`),
        api.get(`/posts/${id}/likes/count`),
      ]);

      setPost(postData.post);
      setComments(commentsData.data || []);

      // Extract like count safely
      let count = 0;
      if (typeof likeData === "object") {
        if (likeData.count !== undefined) {
          count = likeData.count;
        } else if (likeData.message) {
          const match = likeData.message.match(/\d+/);
          count = match ? parseInt(match[0]) : 0;
        }
      } else if (typeof likeData === "number") {
        count = likeData;
      }
      setLikeCount(count);
    } catch (err) {
      console.error("Failed to load post data:", err);
      showToast(err.message || "Failed to load post", "error");
      navigate("/posts");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      showToast("Please login to like posts", "warning");
      navigate("/login");
      return;
    }

    setIsLiking(true);
    try {
      await api.patch(`/posts/${id}/like`);
      setLikeCount((prev) => prev + 1); // Optimistic update
      showToast("Liked!", "success");
    } catch (err) {
      // Revert optimistic update on error
      setLikeCount((prev) => prev - 1);
      showToast(err.message || "Failed to like post", "error");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showToast("Comment cannot be empty", "warning");
      return;
    }

    if (!isAuthenticated || !token) {
      showToast("Please login to comment", "warning");
      navigate("/login");
      return;
    }

    setSubmittingComment(true);
    try {
      await api.post(`/posts/${id}/comments`, {
        text: commentText, // Changed from 'comments' to 'text' if that's what your backend expects
        comment: commentText,
      });

      setCommentText("");
      // Refresh comments
      const commentsData = await api.get(
        `/posts/${id}/comments?page=1&limit=20`
      );
      setComments(commentsData.data || []);
      showToast("Comment added successfully!", "success");
    } catch (err) {
      console.error("Failed to add comment:", err);
      showToast(err.message || "Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      // Optimistic update - remove comment immediately
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
      showToast("Comment deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete comment:", err);
      showToast(err.message || "Failed to delete comment", "error");
      // Refresh comments to revert optimistic update
      fetchPostData();
    }
  };

  const handleDeletePost = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    )
      return;

    try {
      await api.delete(`/posts/${id}`);
      showToast("Post deleted successfully!", "success");
      navigate("/posts");
    } catch (err) {
      console.error("Failed to delete post:", err);
      showToast(err.message || "Failed to delete post", "error");
    }
  };

  const handleEditPost = async () => {
    if (!isAuthenticated) {
      showToast("Please login to edit posts", "warning");
      navigate("/login");
      return;
    }

    // verifying use is the post author or not
    if (!isPostOwner) {
      showToast("You can edit only edit your own posts", "error");
    }

    try {
      await api.get(`/posts/${id}`);
      navigate(`/posts/${id}/edit`);
    } catch (err) {
      showToast("You are not authorized to edit this post", "error");
    }
  };

  // Check if current user is the post owner
  const isPostOwner =
    user &&
    post?.author &&
    (user.email === post.author.email ||
      user._id === post.author._id ||
      user.id === post.author.id);

  // Check if current user is comment owner
  const isCommentOwner = (commentUser) => {
    return (
      user &&
      commentUser &&
      (user.email === commentUser.email ||
        user._id === commentUser._id ||
        user.id === commentUser.id)
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card text-center">
        <div className="card-body">
          <h3>Post Not Found</h3>
          <p>
            The post you're looking for doesn't exist or may have been deleted.
          </p>
          <button
            onClick={() => navigate("/posts")}
            className="btn btn-primary"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      {/* Post Content */}
      <article className="card post-card">
        {/* Post Actions for Owner */}
        {isPostOwner && (
          <div className="post-actions">
            <button
              onClick={handleEditPost}
              className="btn btn-outline btn-sm"
              title="Edit Post"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDeletePost}
              className="btn btn-danger btn-sm"
              title="Delete Post"
            >
              🗑️ Delete
            </button>
          </div>
        )}

        {/* Post Header */}
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <span className="author">
              by {post.author?.name || post.author?.email || "Unknown Author"}
            </span>
            {post.createdAt && (
              <span className="post-date">
                • {new Date(post.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </header>

        {/* Post Image */}
        {post.image && (
          <div className="post-image-container">
            <img
              src={post.image}
              alt={post.title}
              className="post-image"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Post Tags */}
        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Content */}
        <div className="post-content">{post.content}</div>

        {/* Post Interactions */}
        <footer className="post-footer">
          <div className="post-actions">
            <button
              onClick={handleLike}
              disabled={isLiking || !isAuthenticated}
              className={`like-btn ${isLiking ? "loading" : ""}`}
            >
              {isLiking ? "❤️ Liking..." : "❤️ Like"}
            </button>
            <span className="like-count">{likeCount} likes</span>
            <button className="comment-btn">
              💬 {comments.length} comments
            </button>
          </div>
        </footer>
      </article>

      {/* Comments Section */}
      <section className="comments-section card">
        <h2 className="comments-title">Comments ({comments.length})</h2>

        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="comment-form">
            <div className="form-group">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="comment-textarea"
                rows="4"
                maxLength={500}
                disabled={submittingComment}
              />
              <div className="comment-char-count">{commentText.length}/500</div>
            </div>
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="btn btn-primary"
            >
              {submittingComment ? (
                <>
                  <span className="spinner-small"></span>
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            <p>
              Please{" "}
              <button onClick={() => navigate("/login")} className="btn-link">
                login
              </button>{" "}
              to join the conversation.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="comment-card">
                <div className="comment-content">
                  <p className="comment-text">
                    {comment.text || comment.comment}
                  </p>
                  <div className="comment-meta">
                    <span className="comment-author">
                      —{" "}
                      {comment.user?.name || comment.user?.email || "Anonymous"}
                    </span>
                    {comment.createdAt && (
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Actions */}
                {isCommentOwner(comment.user) && (
                  <div className="comment-actions">
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="btn btn-danger btn-sm"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
