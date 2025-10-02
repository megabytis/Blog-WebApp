import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { showToast } from "../utils/toast";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    tags: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadPost();
  }, [id, isAuthenticated, navigate]);

  const loadPost = async () => {
    try {
      const data = await api.get(`/posts/${id}`);
      const post = data.post;

      setFormData({
        title: post.title,
        content: post.content,
        image: post.image || "",
        tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      });
    } catch (err) {
      showToast(err.message, "error");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      await api.patch(`/posts/${id}`, {
        title: formData.title,
        content: formData.content,
        image: formData.image,
        tags,
      });

      showToast("Post updated successfully!", "success");
      navigate(`/posts/${id}`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="card">
        <h2>Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              className="textarea"
              rows="8"
            />
          </div>
          <div className="form-group">
            <label>Image URL (optional)</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Tags (optional)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input"
              placeholder="javascript, react, node"
            />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
