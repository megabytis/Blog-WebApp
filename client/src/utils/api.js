const API_BASE = import.meta.env.VITE_API_BASE || "";

export const api = {
  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;

    const config = {
      credentials: "include", // This is crucial for cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    // Check if response is unauthorized
    if (response.status === 401) {
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
      throw new Error("Please login to continue");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: "POST", body });
  },

  patch(path, body) {
    return this.request(path, { method: "PATCH", body });
  },

  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};
