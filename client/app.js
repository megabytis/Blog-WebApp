(() => {
  const API_BASE = "https://blog-webapp-alzm.onrender.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const app = $("#app");
  const toastBox = $("#toast");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Simple Storage & Auth ---
  const storage = {
    getUser: () => {
      try {
        return JSON.parse(localStorage.getItem("auth_user") || "null");
      } catch {
        return null;
      }
    },
    setUser: (u) =>
      localStorage.setItem("auth_user", JSON.stringify(u || null)),
    clearUser: () => localStorage.removeItem("auth_user"),
  };

  const isAuthed = () => !!storage.getUser();

  function updateNav() {
    const authed = isAuthed();
    $$(".auth-only").forEach((el) => el.classList.toggle("hidden", !authed));
    $$(".anon-only").forEach((el) => el.classList.toggle("hidden", authed));
  }

  // --- Fetch helper (Cookie-based auth) ---
  async function fetchJSON(path, { method = "GET", body, headers = {} } = {}) {
    const url = `${API_BASE}${path}`;

    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // Important for cookies
    };

    const res = await fetch(url, config);

    const contentType = res.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");
    const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const msg =
        data?.message || (typeof data === "string" ? data : "Request failed");
      throw new Error(msg);
    }

    return data;
  }

  // --- Toasts ---
  function toast(msg, kind = "ok", timeout = 3200) {
    const t = document.createElement("div");
    t.className = `toast ${kind}`;
    t.textContent = msg;
    toastBox.appendChild(t);
    setTimeout(() => t.remove(), timeout);
  }

  // --- Router ---
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs = ""] = raw.split("?");
    const params = {};
    qs.split("&")
      .filter(Boolean)
      .forEach((p) => {
        const [k, v] = p.split("=");
        params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    return { path, params };
  }

  function toHash(path, params = {}) {
    const qs = Object.keys(params).length
      ? "?" +
        Object.entries(params)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
          )
          .join("&")
      : "";
    location.hash = path + qs;
  }

  function setBusy(busy) {
    app.setAttribute("aria-busy", busy ? "true" : "false");
  }

  // --- Views ---
  async function viewPostsList(params) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 6);
    const search = params.search || "";
    const tags = params.tags || "";

    app.innerHTML = `
      <section class="card">
        <div class="card-inner">
          <div class="toolbar">
            <form id="searchForm" class="form-row" style="flex:1; margin-right:.5rem;">
              <input class="input" type="search" name="search" placeholder="Search posts..." value="${escapeHTML(
                search
              )}"/>
              <input class="input" type="text" name="tags" placeholder="Tags (comma separated)" value="${escapeHTML(
                tags
              )}"/>
              <button class="btn btn-primary" type="submit">Search</button>
            </form>
            <span class="spacer"></span>
            ${
              isAuthed()
                ? `<a class="btn btn-accent btn-sm" href="#/new">+ New Post</a>`
                : ""
            }
          </div>
        </div>
      </section>
      <div id="postsGrid" class="grid" style="margin-top:16px;"></div>
      <div id="pager" class="pagination"></div>
    `;

    setBusy(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(tags && { tags }),
      }).toString();

      const data = await fetchJSON(`/posts?${q}`);
      const posts = data.post || [];

      const grid = $("#postsGrid");
      if (!posts.length) {
        grid.innerHTML = `<div class="card"><div class="card-inner"><p class="helper">No posts found.</p></div></div>`;
      } else {
        grid.innerHTML = posts.map(postCard).join("");
        $$("#postsGrid .go-detail").forEach((btn) => {
          btn.addEventListener("click", () =>
            toHash(`#/post/${btn.dataset.id}`)
          );
        });
      }

      // Simple pagination
      const pager = $("#pager");
      const hasPrev = page > 1;
      const hasNext = posts.length >= limit;
      pager.innerHTML = `
        <button class="btn btn-ghost btn-sm" ${
          !hasPrev ? "disabled" : ""
        } id="prevPage">← Prev</button>
        <span class="page-info">Page ${page}</span>
        <button class="btn btn-ghost btn-sm" ${
          !hasNext ? "disabled" : ""
        } id="nextPage">Next →</button>
      `;
      $("#prevPage")?.addEventListener("click", () =>
        toHash("#/", { page: page - 1, limit, search, tags })
      );
      $("#nextPage")?.addEventListener("click", () =>
        toHash("#/", { page: page + 1, limit, search, tags })
      );

      $("#searchForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const s = fd.get("search").toString().trim();
        const t = fd.get("tags").toString().trim();
        toHash("#/", { page: 1, limit, search: s, tags: t });
      });
    } catch (err) {
      toast(err.message, "err");
      $(
        "#postsGrid"
      ).innerHTML = `<div class="card"><div class="card-inner"><p class="helper">Error loading posts.</p></div></div>`;
    } finally {
      setBusy(false);
    }
  }

  function postCard(p) {
    const author = p.author?.name || p.author?.email || "Unknown";
    const tags = Array.isArray(p.tags) ? p.tags : [];

    return `
      <article class="card">
        <div class="card-inner">
          <h3 class="card-title">${escapeHTML(p.title)}</h3>
          <p class="card-meta">by ${escapeHTML(author)} • ${
      p.likesCount || 0
    } likes</p>
          <p>${escapeHTML(
            p.content.length > 180 ? p.content.slice(0, 180) + "…" : p.content
          )}</p>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm go-detail" data-id="${escapeAttr(
              p._id
            )}">Read</button>
            ${
              tags.length
                ? `<div class="helper">Tags: ${tags
                    .map((t) => `<span class="badge">${escapeHTML(t)}</span>`)
                    .join(" ")}</div>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  async function viewPostDetail(id) {
    app.innerHTML = `
      <section class="card">
        <div class="card-inner" id="postWrap">Loading post…</div>
      </section>
      <section class="card" style="margin-top:16px;">
        <div class="card-inner">
          <div class="toolbar">
            <button class="btn btn-ghost btn-sm" id="backBtn">← Back</button>
            <span class="spacer"></span>
            <div id="ownerActions"></div>
          </div>
          <hr class="sep" />
          <div class="toolbar">
            <button class="btn btn-accent btn-sm" id="likeBtn">❤ Like</button>
            <span id="likeCount" class="helper">Likes: —</span>
          </div>
        </div>
      </section>
      <section class="card" style="margin-top:16px;">
        <div class="card-inner" id="commentsWrap">
          <h4 style="margin:0 0 8px;">Comments</h4>
          <div id="commentsList"></div>
          <div class="pagination" id="commentsPager"></div>
          ${
            isAuthed()
              ? `
            <hr class="sep" />
            <form id="commentForm" class="form-group">
              <label class="label">Add a comment</label>
              <textarea class="textarea" id="commentBody" name="comments" placeholder="Write a comment…" required></textarea>
              <button class="btn btn-primary btn-sm" type="submit">Post Comment</button>
            </form>`
              : `<p class="helper">Please <a href="#/login">log in</a> to comment.</p>`
          }
        </div>
      </section>
    `;

    $("#backBtn").addEventListener("click", () => history.back());

    // Load post
    try {
      const data = await fetchJSON(`/posts/${id}`);
      const post = data.post;
      renderPost(post);
      bindOwnerActions(post);
    } catch (err) {
      $("#postWrap").innerHTML = `<p class="helper">Failed to load post.</p>`;
      toast(err.message, "err");
    }

    // Likes
    await refreshLikes(id);
    $("#likeBtn").addEventListener("click", async () => {
      if (!isAuthed()) {
        toHash("#/login");
        return;
      }
      try {
        await fetchJSON(`/posts/${id}/like`, { method: "PATCH" });
        await refreshLikes(id);
        toast("Liked!", "ok");
      } catch (err) {
        toast(err.message, "err");
      }
    });

    // Comments
    let cPage = 1;
    const cLimit = 3;

    async function loadComments() {
      try {
        const q = new URLSearchParams({
          page: String(cPage),
          limit: String(cLimit),
        }).toString();
        const data = await fetchJSON(`/posts/${id}/comments?${q}`);
        const comments = data.data || [];
        renderComments(comments);

        const hasPrev = cPage > 1;
        const hasNext = comments.length >= cLimit;
        $("#commentsPager").innerHTML = `
          <button class="btn btn-ghost btn-sm" ${
            !hasPrev ? "disabled" : ""
          } id="cPrev">← Prev</button>
          <span class="page-info">Page ${cPage}</span>
          <button class="btn btn-ghost btn-sm" ${
            !hasNext ? "disabled" : ""
          } id="cNext">Next →</button>
        `;
        $("#cPrev")?.addEventListener("click", () => {
          cPage--;
          loadComments();
        });
        $("#cNext")?.addEventListener("click", () => {
          cPage++;
          loadComments();
        });
      } catch (err) {
        $(
          "#commentsList"
        ).innerHTML = `<p class="helper">Failed to load comments.</p>`;
      }
    }
    await loadComments();

    $("#commentForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAuthed()) {
        toHash("#/login");
        return;
      }
      const fd = new FormData(e.currentTarget);
      const comments = fd.get("comments").toString().trim();
      if (!comments) return;
      try {
        await fetchJSON(`/posts/${id}/comments`, {
          method: "POST",
          body: { comments },
        });
        $("#commentBody").value = "";
        cPage = 1;
        await loadComments();
        toast("Comment added!", "ok");
      } catch (err) {
        toast(err.message, "err");
      }
    });

    function renderPost(p) {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const author = p.author?.name || p.author?.email || "Unknown";

      $("#postWrap").innerHTML = `
        <h1 style="margin:0 0 6px;">${escapeHTML(p.title)}</h1>
        <p class="card-meta">by ${escapeHTML(author)}</p>
        ${
          p.image
            ? `<img src="${escapeAttr(
                p.image
              )}" alt="Post image" style="max-width:100%; margin:10px 0;" />`
            : ""
        }
        ${
          tags.length
            ? `<p class="helper">Tags: ${tags
                .map((t) => `<span class="badge">${escapeHTML(t)}</span>`)
                .join(" ")}</p>`
            : ""
        }
        <hr class="sep" />
        <article>
          <p style="white-space:pre-wrap;">${escapeHTML(p.content)}</p>
        </article>
      `;
    }

    function bindOwnerActions(p) {
      const user = storage.getUser();
      if (!user || !p.author) return;

      // Simple ownership check - in real app, you'd compare user ID with post author ID
      $("#ownerActions").innerHTML = `
        <a class="btn btn-ghost btn-sm" href="#/post/${escapeAttr(
          p._id
        )}/edit">Edit</a>
        <button class="btn btn-danger btn-sm" id="deletePost">Delete</button>
      `;

      $("#deletePost").addEventListener("click", async () => {
        if (!confirm("Delete this post?")) return;
        try {
          await fetchJSON(`/posts/${id}`, { method: "DELETE" });
          toast("Post deleted", "ok");
          toHash("#/");
        } catch (err) {
          toast(err.message, "err");
        }
      });
    }

    function renderComments(comments) {
      $("#commentsList").innerHTML = comments.length
        ? comments
            .map(
              (c) => `
        <div class="card">
          <div class="card-inner">
            <p style="white-space:pre-wrap; margin:0;">${escapeHTML(c.text)}</p>
            <div class="card-actions">
              <span class="helper">by ${
                c.user?.name || c.user?.email || "User"
              }</span>
              <span class="spacer"></span>
              <button class="btn btn-ghost btn-sm del-comment" data-id="${escapeAttr(
                c._id
              )}">Delete</button>
            </div>
          </div>
        </div>
      `
            )
            .join("")
        : `<p class="helper">No comments yet.</p>`;

      $$(".del-comment").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this comment?")) return;
          try {
            await fetchJSON(`/posts/${id}/comments/${btn.dataset.id}`, {
              method: "DELETE",
            });
            toast("Comment deleted", "ok");
            await loadComments();
          } catch (err) {
            toast(err.message, "err");
          }
        });
      });
    }

    async function refreshLikes(pid) {
      try {
        const data = await fetchJSON(`/posts/${pid}/likes/count`);
        const count =
          typeof data === "object"
            ? data.message?.match(/\d+/)?.[0] || 0
            : data;
        $("#likeCount").textContent = `Likes: ${count}`;
      } catch {
        $("#likeCount").textContent = `Likes: —`;
      }
    }
  }

  async function viewLogin() {
    app.innerHTML = `
      <section class="card center" style="min-height:40vh;">
        <div class="card-inner" style="width:min(520px, 100%);">
          <h2>Log in</h2>
          <form id="loginForm">
            <div class="form-group">
              <label class="label">Email</label>
              <input class="input" name="email" type="email" required />
            </div>
            <div class="form-group">
              <label class="label">Password</label>
              <input class="input" name="password" type="password" required />
            </div>
            <button class="btn btn-primary btn-wide" type="submit">Log in</button>
          </form>
          <p class="helper">No account? <a href="#/signup">Sign up</a></p>
        </div>
      </section>
    `;

    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = fd.get("email").toString().trim();
      const password = fd.get("password").toString();

      try {
        await fetchJSON("/auth/login", {
          method: "POST",
          body: { email, password },
        });

        storage.setUser({ email });
        toast("Logged in", "ok");
        updateNav();
        toHash("#/");
      } catch (err) {
        toast(err.message, "err");
      }
    });
  }

  async function viewSignup() {
    app.innerHTML = `
      <section class="card center" style="min-height:40vh;">
        <div class="card-inner" style="width:min(520px, 100%);">
          <h2>Create an account</h2>
          <form id="signupForm">
            <div class="form-group">
              <label class="label">Name</label>
              <input class="input" name="name" type="text" required />
            </div>
            <div class="form-group">
              <label class="label">Email</label>
              <input class="input" name="email" type="email" required />
            </div>
            <div class="form-group">
              <label class="label">Password</label>
              <input class="input" name="password" type="password" required />
              <p class="helper">Must include uppercase, lowercase, number, symbol, and be 8+ characters</p>
            </div>
            <div class="form-group">
              <label class="label">Bio</label>
              <textarea class="textarea" name="bio" placeholder="Tell us about yourself..."></textarea>
            </div>
            <button class="btn btn-primary btn-wide" type="submit">Sign up</button>
          </form>
          <p class="helper">Have an account? <a href="#/login">Log in</a></p>
        </div>
      </section>
    `;

    $("#signupForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = fd.get("name").toString().trim();
      const email = fd.get("email").toString().trim();
      const password = fd.get("password").toString();
      const bio = fd.get("bio").toString().trim();

      try {
        await fetchJSON("/auth/signup", {
          method: "POST",
          body: { name, email, password, bio },
        });

        toast("Account created. Please log in.", "ok");
        toHash("#/login");
      } catch (err) {
        toast(err.message, "err");
      }
    });
  }

  async function viewNewPost() {
    if (!isAuthed()) {
      toHash("#/login");
      return;
    }

    app.innerHTML = `
      <section class="card">
        <div class="card-inner" style="width:min(760px, 100%); margin: 0 auto;">
          <h2>New Post</h2>
          <form id="postForm">
            <div class="form-group">
              <label class="label">Title</label>
              <input class="input" name="title" type="text" required />
            </div>
            <div class="form-group">
              <label class="label">Content</label>
              <textarea class="textarea" name="content" required></textarea>
            </div>
            <div class="form-group">
              <label class="label">Image URL</label>
              <input class="input" name="image" type="url" placeholder="https://example.com/image.jpg" />
            </div>
            <div class="form-group">
              <label class="label">Tags</label>
              <input class="input" name="tags" type="text" placeholder="js,node,express" />
              <p class="helper">Comma-separated</p>
            </div>
            <div class="toolbar">
              <button class="btn btn-primary" type="submit">Publish</button>
              <a class="btn btn-ghost" href="#/">Cancel</a>
            </div>
          </form>
        </div>
      </section>
    `;

    $("#postForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const title = fd.get("title").toString().trim();
      const content = fd.get("content").toString();
      const image = fd.get("image").toString().trim();
      const tagsStr = fd.get("tags").toString();

      const tags = tagsStr
        ? tagsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      try {
        const data = await fetchJSON("/posts", {
          method: "POST",
          body: { title, content, image, tags },
        });

        toast("Post created", "ok");
        if (data.data?._id) toHash(`#/post/${data.data._id}`);
        else toHash("#/");
      } catch (err) {
        toast(err.message, "err");
      }
    });
  }

  async function viewEditPost(id) {
    if (!isAuthed()) {
      toHash("#/login");
      return;
    }

    setBusy(true);
    try {
      const data = await fetchJSON(`/posts/${id}`);
      const post = data.post;

      app.innerHTML = `
        <section class="card">
          <div class="card-inner" style="width:min(760px, 100%); margin: 0 auto;">
            <h2>Edit Post</h2>
            <form id="editForm">
              <div class="form-group">
                <label class="label">Title</label>
                <input class="input" name="title" type="text" required value="${escapeAttr(
                  post.title
                )}" />
              </div>
              <div class="form-group">
                <label class="label">Content</label>
                <textarea class="textarea" name="content" required>${escapeHTML(
                  post.content
                )}</textarea>
              </div>
              <div class="form-group">
                <label class="label">Image URL</label>
                <input class="input" name="image" type="url" value="${escapeAttr(
                  post.image || ""
                )}" />
              </div>
              <div class="form-group">
                <label class="label">Tags</label>
                <input class="input" name="tags" type="text" value="${escapeAttr(
                  Array.isArray(post.tags) ? post.tags.join(",") : ""
                )}" />
                <p class="helper">Comma-separated</p>
              </div>
              <div class="toolbar">
                <button class="btn btn-primary" type="submit">Save</button>
                <a class="btn btn-ghost" href="#/post/${escapeAttr(
                  id
                )}">Cancel</a>
              </div>
            </form>
          </div>
        </section>
      `;

      $("#editForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = fd.get("title").toString().trim();
        const content = fd.get("content").toString();
        const image = fd.get("image").toString().trim();
        const tagsStr = fd.get("tags").toString();
        const tags = tagsStr
          ? tagsStr
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        try {
          await fetchJSON(`/posts/${id}`, {
            method: "PATCH",
            body: { title, content, image, tags },
          });

          toast("Post updated", "ok");
          toHash(`#/post/${id}`);
        } catch (err) {
          toast(err.message, "err");
        }
      });
    } catch (err) {
      toast(err.message, "err");
      toHash("#/");
    } finally {
      setBusy(false);
    }
  }

  // --- Logout ---
  async function doLogout() {
    try {
      await fetchJSON("/auth/logout", { method: "POST" });
    } catch (err) {
      // Ignore errors during logout
    } finally {
      storage.clearUser();
      updateNav();
      toast("Logged out", "ok");
      toHash("#/");
    }
  }

  // --- Router ---
  async function route() {
    updateNav();
    const { path, params } = parseHash();

    if (path === "/" || path === "") return viewPostsList(params);
    if (path === "/login") return viewLogin();
    if (path === "/signup") return viewSignup();
    if (path === "/new") return viewNewPost();

    const postMatch = path.match(/^\/post\/([^/]+)$/);
    if (postMatch) return viewPostDetail(postMatch[1]);

    const editMatch = path.match(/^\/post\/([^/]+)\/edit$/);
    if (editMatch) return viewEditPost(editMatch[1]);

    // 404
    app.innerHTML = `
      <section class="card center" style="min-height:40vh;">
        <div class="card-inner" style="text-align:center;">
          <h2>Not found</h2>
          <p class="helper">The page you requested does not exist.</p>
          <a class="btn btn-primary" href="#/">Go home</a>
        </div>
      </section>
    `;
  }

  // --- Helpers ---
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(s) {
    return escapeHTML(s).replaceAll("`", "&#096;");
  }

  // --- Init ---
  $("#nav-logout")?.addEventListener("click", doLogout);
  window.addEventListener("hashchange", route);
  window.addEventListener("load", () => {
    updateNav();
    if (!location.hash) location.hash = "#/";
    route();
  });
})();
