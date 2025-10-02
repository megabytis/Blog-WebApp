const API_BASE = import.meta.env.VITE_API_BASE || "";

export const api = {
  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;

    const config = {
      credentials: "include",
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

    // If it's a 401 (Unauthorized) but we're trying to access public content,
    // don't throw error, return empty data instead
    if (
      response.status === 401 &&
      (path.includes("/posts") || path.includes("/comments"))
    ) {
      console.log("User not logged in, returning empty data for public route");
      return { post: [], data: [] }; // Return empty data structure
    }

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text();

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
