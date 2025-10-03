import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { showToast } from "../utils/toast";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(tags && { tags }),
      });

      const data = await api.get(`/posts?${params}`);
      setPosts(data.post || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="form-group">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Posts Grid */}
      <div className="grid">
        {posts.map((post) => (
          <div key={post._id} className="card">
            <h3 className="card-title">{post.title}</h3>
            <p className="card-meta">
              by {post.author?.name || post.author?.email} •{" "}
              {post.likesCount || 0} likes
            </p>
            <p className="card-content">
              {post.content.length > 150
                ? `${post.content.substring(0, 150)}...`
                : post.content}
            </p>
            <div className="card-actions">
              <Link
                to={`/posts/${post._id}`}
                className="btn btn-primary btn-sm"
              >
                Read More
              </Link>
              {post.tags?.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {post.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card text-center">
          <p>No posts found. Try adjusting your search.</p>
        </div>
      )}

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn btn-ghost"
        >
          Previous
        </button>
        <span style={{ display: "flex", alignItems: "center" }}>
          Page {page}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={posts.length < limit}
          className="btn btn-ghost"
        >
          Next
        </button>
      </div>
    </div>
  );
}
