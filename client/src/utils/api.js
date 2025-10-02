const API_BASE = "https://blog-webapp-alzm.onrender.com";

export const api = {
  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;

    const config = {
      credentials: "include", // Important for cookies
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
