import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { showToast } from "../utils/toast";

export default function CreatePost() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const postData = {
        title: formData.title,
        content: formData.content,
        ...(formData.image && { image: formData.image }),
        tags,
      };

      const data = await api.post("/posts", postData);
      showToast("Post created successfully!", "success");
      navigate(`/posts/${data.data._id}`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginBottom: "1rem" }}>Create New Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title</label>
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
            <label className="label">Content</label>
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
            <label className="label">Image URL (optional)</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="form-group">
            <label className="label">Tags (optional)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input"
              placeholder="javascript, react, node"
            />
            <small style={{ color: "#6b7280" }}>
              Separate tags with commas
            </small>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
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
