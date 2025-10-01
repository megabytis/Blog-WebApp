import axios from "axios";

const API_BASE = "https://blog-webapp-alzm.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (userData) => api.post("/auth/signup", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
};

// Post APIs
export const postAPI = {
  getPosts: (params = {}) => api.get("/posts", { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post("/posts", data),
  updatePost: (id, data) => api.patch(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  getLikes: (id) => api.get(`/posts/${id}/likes/count`),
};

// Comment APIs
export const commentAPI = {
  getComments: (postId, params = {}) =>
    api.get(`/posts/${postId}/comments`, { params }),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  deleteComment: (postId, commentId) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
};

export default api;
