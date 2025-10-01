/* add vanilla JS SPA with routing and API integration */

(() => {
  const API_BASE = "https://blog-webapp-alzm.onrender.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const app = $("#app");
  const toastBox = $("#toast");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Storage & Auth ---
  const storage = {
    getToken: () => localStorage.getItem("auth_token") || "",
    setToken: (t) => localStorage.setItem("auth_token", t || ""),
    clearToken: () => localStorage.removeItem("auth_token"),
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
  const isAuthed = () => !!storage.getToken();

  function updateNav() {
    const authed = isAuthed();
    $$(".auth-only").forEach((el) => el.classList.toggle("hidden", !authed));
    $$(".anon-only").forEach((el) => el.classList.toggle("hidden", authed));
  }

  // --- Fetch helper ---
  async function fetchJSON(
    path,
    { method = "GET", body, headers = {}, auth = false } = {}
  ) {
    const url = `${API_BASE}${path}`;
    const h = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (auth && storage.getToken())
      h["Authorization"] = `Bearer ${storage.getToken()}`;

    const res = await fetch(url, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");
    const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const msg =
        (data && data.message) ||
        (typeof data === "string" ? data : "Request failed");
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

  // --- Router helpers ---
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
          <div class="toolbar" role="region" aria-label="Posts toolbar">
            <form id="searchForm" class="form-row" style="flex:1; margin-right:.5rem;">
              <input class="input" type="search" name="search" placeholder="Search posts (e.g., js, node, express)..." value="${escapeHTML(
                search
              )}" aria-label="Search posts"/>
              <input class="input" type="text" name="tags" placeholder="Tags (comma separated)" value="${escapeHTML(
                tags
              )}" aria-label="Filter by tags"/>
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
        ...(search ? { search } : {}),
        ...(tags ? { tags } : {}),
      }).toString();

      const data = await fetchJSON(`/posts?${q}`, { method: "GET" });

      // Accept array or {items:[], total}
      const items = Array.isArray(data)
        ? data
        : data.items || data.results || [];
      const total = data.total || data.count || undefined;

      const grid = $("#postsGrid");
      if (!items || items.length === 0) {
        grid.innerHTML = `<div class="card"><div class="card-inner"><p class="helper">No posts found. Try adjusting your search.</p></div></div>`;
      } else {
        grid.innerHTML = items.map((p) => postCard(p)).join("");
        // Bind click handlers
        $$("#postsGrid .go-detail").forEach((btn) => {
          btn.addEventListener("click", () => {
            toHash(`#/post/${btn.dataset.id}`);
          });
        });
      }

      const pager = $("#pager");
      const hasPrev = page > 1;
      const hasNext =
        items && items.length >= limit && (total ? page * limit < total : true);
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
        const s = (fd.get("search") || "").toString().trim();
        const t = (fd.get("tags") || "").toString().trim();
        toHash("#/", { page: 1, limit, search: s, tags: t });
      });
    } catch (err) {
      toast(err.message || "Failed to load posts", "err");
      $(
        "#postsGrid"
      ).innerHTML = `<div class="card"><div class="card-inner"><p class="helper">Error loading posts.</p></div></div>`;
    } finally {
      setBusy(false);
    }
  }

  function postCard(p) {
    const id = p.id || p._id || p.postID || p.postId;
    const title = p.title || "Untitled";
    const content = p.content || p.body || "";
    const excerpt =
      content.length > 180 ? content.slice(0, 180) + "…" : content;
    const tags = (
      p.tags && Array.isArray(p.tags)
        ? p.tags
        : typeof p.tags === "string"
        ? p.tags.split(",")
        : []
    )
      .map((t) => String(t).trim())
      .filter(Boolean);
    const author =
      (p.author && (p.author.name || p.author.username || p.author.email)) ||
      p.authorName ||
      "Unknown";

    return `
      <article class="card">
        <div class="card-inner">
          <h3 class="card-title">${escapeHTML(title)}</h3>
          <p class="card-meta">by ${escapeHTML(author)}</p>
          <p>${escapeHTML(excerpt)}</p>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm go-detail" data-id="${escapeAttr(
              id
            )}" aria-label="Read post">Read</button>
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
        <div class="card-inner" id="postWrap">
          <p class="helper">Loading post…</p>
        </div>
      </section>
      <section class="card" style="margin-top:16px;">
        <div class="card-inner">
          <div class="toolbar">
            <button class="btn btn-ghost btn-sm" id="backBtn">← Back</button>
            <span class="spacer"></span>
            <div class="toolbar" id="ownerActions"></div>
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
              <label class="label" for="commentBody">Add a comment</label>
              <textarea class="textarea" id="commentBody" name="body" placeholder="Write a comment…" required></textarea>
              <button class="btn btn-primary btn-sm" type="submit">Post Comment</button>
            </form>`
              : `<p class="helper">Please <a href="#/login">log in</a> to comment.</p>`
          }
        </div>
      </section>
    `;

    $("#backBtn")?.addEventListener("click", () => history.back());

    // Load post
    try {
      const post = await fetchJSON(`/posts/${encodeURIComponent(id)}`);
      renderPost(post);
      bindOwnerActions(post);
    } catch (err) {
      $("#postWrap").innerHTML = `<p class="helper">Failed to load post.</p>`;
      toast(err.message || "Failed to load post", "err");
    }

    // Likes
    await refreshLikes(id);
    $("#likeBtn")?.addEventListener("click", async () => {
      if (!isAuthed()) {
        toHash("#/login");
        return;
      }
      try {
        await fetchJSON(`/posts/${encodeURIComponent(id)}/like`, {
          method: "POST",
          auth: true,
        });
        await refreshLikes(id);
        toast("Liked!", "ok");
      } catch (err) {
        toast(err.message || "Failed to like", "err");
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
        const data = await fetchJSON(
          `/posts/${encodeURIComponent(id)}/comments?${q}`
        );
        const items = Array.isArray(data)
          ? data
          : data.items || data.results || [];
        const total = data.total || data.count || undefined;
        renderComments(items);
        const hasPrev = cPage > 1;
        const hasNext =
          items &&
          items.length >= cLimit &&
          (total ? cPage * cLimit < total : true);
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
          cPage -= 1;
          loadComments();
        });
        $("#cNext")?.addEventListener("click", () => {
          cPage += 1;
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
      const body = (fd.get("body") || "").toString().trim();
      if (!body) return;
      try {
        await fetchJSON(`/posts/${encodeURIComponent(id)}/comments`, {
          method: "POST",
          auth: true,
          body: { body },
        });
        $("#commentBody").value = "";
        cPage = 1;
        await loadComments();
      } catch (err) {
        toast(err.message || "Failed to add comment", "err");
      }
    });

    function renderPost(p) {
      const title = p.title || "Untitled";
      const content = p.content || p.body || "";
      const tags = (
        p.tags && Array.isArray(p.tags)
          ? p.tags
          : typeof p.tags === "string"
          ? p.tags.split(",")
          : []
      )
        .map((t) => String(t).trim())
        .filter(Boolean);
      const author =
        (p.author && (p.author.name || p.author.username || p.author.email)) ||
        p.authorName ||
        "Unknown";
      $("#postWrap").innerHTML = `
        <h1 style="margin:0 0 6px;">${escapeHTML(title)}</h1>
        <p class="card-meta">by ${escapeHTML(author)}</p>
        ${
          tags.length
            ? `<p class="helper">Tags: ${tags
                .map((t) => `<span class="badge">${escapeHTML(t)}</span>`)
                .join(" ")}</p>`
            : ""
        }
        <hr class="sep" />
        <article>
          <p style="white-space:pre-wrap;">${escapeHTML(content)}</p>
        </article>
      `;
    }

    function bindOwnerActions(p) {
      const user = storage.getUser();
      const postAuthorId =
        (p.author && (p.author.id || p.author._id || p.authorId)) ||
        p.authorId ||
        p.userId;
      const currentUserId = user && (user.id || user._id || user.userId);
      const owner =
        isAuthed() &&
        postAuthorId &&
        currentUserId &&
        String(postAuthorId) === String(currentUserId);
      if (!owner) return;
      $("#ownerActions").innerHTML = `
        <a class="btn btn-ghost btn-sm" id="editPost" href="#/post/${escapeAttr(
          p.id || p._id || p.postId || p.postID
        )}/edit">Edit</a>
        <button class="btn btn-danger btn-sm" id="deletePost">Delete</button>
      `;
      $("#deletePost")?.addEventListener("click", async () => {
        if (!confirm("Delete this post?")) return;
        try {
          await fetchJSON(`/posts/${encodeURIComponent(id)}`, {
            method: "DELETE",
            auth: true,
          });
          toast("Post deleted", "ok");
          toHash("#/");
        } catch (err) {
          toast(err.message || "Failed to delete", "err");
        }
      });
    }

    function renderComments(list) {
      const user = storage.getUser();
      const currentUserId = user && (user.id || user._id || user.userId);
      $("#commentsList").innerHTML =
        !list || list.length === 0
          ? `<p class="helper">No comments yet.</p>`
          : list
              .map((c) => {
                const cid = c.id || c._id || c.commentId || c.commentID;
                const ownerId =
                  (c.user && (c.user.id || c.user._id || c.userId)) ||
                  c.userId ||
                  c.authorId;
                const canDelete =
                  isAuthed() &&
                  ownerId &&
                  currentUserId &&
                  String(ownerId) === String(currentUserId);
                return `
              <div class="card">
                <div class="card-inner">
                  <p style="white-space:pre-wrap; margin:0;">${escapeHTML(
                    c.body || c.text || ""
                  )}</p>
                  <div class="card-actions">
                    <span class="helper">by ${escapeHTML(
                      (c.user &&
                        (c.user.username || c.user.email || c.user.name)) ||
                        c.authorName ||
                        "User"
                    )}</span>
                    <span class="spacer"></span>
                    ${
                      canDelete
                        ? `<button class="btn btn-ghost btn-sm del-comment" data-id="${escapeAttr(
                            cid
                          )}">Delete</button>`
                        : ""
                    }
                  </div>
                </div>
              </div>
            `;
              })
              .join("");

      $$(".del-comment").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const cid = btn.dataset.id;
          if (!confirm("Delete this comment?")) return;
          try {
            await fetchJSON(
              `/posts/${encodeURIComponent(id)}/comments/${encodeURIComponent(
                cid
              )}`,
              {
                method: "DELETE",
                auth: true,
              }
            );
            toast("Comment deleted", "ok");
            // Reload current comments page
            const ev = new Event("click");
            $("#cPrev")?.dispatchEvent(ev); // quick reload trick; if no prev, just reload
            await viewPostDetail(id);
          } catch (err) {
            toast(err.message || "Failed to delete comment", "err");
          }
        });
      });
    }

    async function refreshLikes(pid) {
      try {
        const data = await fetchJSON(
          `/posts/${encodeURIComponent(pid)}/likes/count`
        );
        const count =
          typeof data === "number" ? data : data.count || data.likes || 0;
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
          <h2 style="margin:0 0 8px;">Log in</h2>
          <p class="helper" style="margin:0 0 12px;">Welcome back. Enter your email and password.</p>
          <form id="loginForm">
            <div class="form-group">
              <label class="label" for="email">Email</label>
              <input class="input" id="email" name="email" type="email" required />
            </div>
            <div class="form-group">
              <label class="label" for="password">Password</label>
              <input class="input" id="password" name="password" type="password" required />
            </div>
            <button class="btn btn-primary btn-wide" type="submit">Log in</button>
          </form>
          <p class="helper" style="margin-top:10px;">No account? <a href="#/signup">Sign up</a></p>
        </div>
      </section>
    `;
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = (fd.get("email") || "").toString().trim();
      const password = (fd.get("password") || "").toString();
      try {
        const data = await fetchJSON("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        const token = data.token || data.accessToken || data.jwt || "";
        if (!token) throw new Error("Missing token in response");
        storage.setToken(token);
        storage.setUser(data.user || data.profile || { email });
        toast("Logged in", "ok");
        updateNav();
        toHash("#/");
      } catch (err) {
        toast(err.message || "Login failed", "err");
      }
    });
  }

  async function viewSignup() {
    app.innerHTML = `
      <section class="card center" style="min-height:40vh;">
        <div class="card-inner" style="width:min(520px, 100%);">
          <h2 style="margin:0 0 8px;">Create an account</h2>
          <p class="helper" style="margin:0 0 12px;">Start posting and join the discussion.</p>
          <form id="signupForm">
            <div class="form-group">
              <label class="label" for="email">Email</label>
              <input class="input" id="email" name="email" type="email" required />
            </div>
            <div class="form-group">
              <label class="label" for="password">Password</label>
              <input class="input" id="password" name="password" type="password" required />
            </div>
            <button class="btn btn-primary btn-wide" type="submit">Sign up</button>
          </form>
          <p class="helper" style="margin-top:10px;">Have an account? <a href="#/login">Log in</a></p>
        </div>
      </section>
    `;
    $("#signupForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = (fd.get("email") || "").toString().trim();
      const password = (fd.get("password") || "").toString();
      try {
        const data = await fetchJSON("/auth/signup", {
          method: "POST",
          body: { email, password },
        });
        // If API logs in on signup, capture token, else redirect to login
        const token = data.token || data.accessToken || "";
        if (token) {
          storage.setToken(token);
          storage.setUser(data.user || { email });
          toast("Signed up and logged in", "ok");
          updateNav();
          toHash("#/");
        } else {
          toast("Account created. Please log in.", "ok");
          toHash("#/login");
        }
      } catch (err) {
        toast(err.message || "Signup failed", "err");
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
          <h2 style="margin:0 0 8px;">New Post</h2>
          <p class="helper" style="margin:0 0 12px;">Share your thoughts with the world.</p>
          <form id="postForm">
            <div class="form-group">
              <label class="label" for="title">Title</label>
              <input class="input" id="title" name="title" type="text" required />
            </div>
            <div class="form-group">
              <label class="label" for="content">Content</label>
              <textarea class="textarea" id="content" name="content" required></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="label" for="tags">Tags</label>
                <input class="input" id="tags" name="tags" type="text" placeholder="e.g., js,node,express" />
                <p class="helper">Comma-separated</p>
              </div>
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
      const title = (fd.get("title") || "").toString().trim();
      const content = (fd.get("content") || "").toString();
      const tagsStr = (fd.get("tags") || "").toString();
      const tags = tagsStr
        ? tagsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      try {
        const data = await fetchJSON("/posts", {
          method: "POST",
          auth: true,
          body: { title, content, tags },
        });
        const id = data.id || data._id || data.postId || data.postID;
        toast("Post created", "ok");
        if (id) toHash(`#/post/${id}`);
        else toHash("#/");
      } catch (err) {
        toast(err.message || "Failed to create post", "err");
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
      const post = await fetchJSON(`/posts/${encodeURIComponent(id)}`);
      const title = post.title || "";
      const content = post.content || post.body || "";
      const tagsArr = Array.isArray(post.tags)
        ? post.tags
        : typeof post.tags === "string"
        ? post.tags.split(",").map((s) => s.trim())
        : [];
      const tags = tagsArr.join(",");

      app.innerHTML = `
        <section class="card">
          <div class="card-inner" style="width:min(760px, 100%); margin: 0 auto;">
            <h2 style="margin:0 0 8px;">Edit Post</h2>
            <form id="editForm">
              <div class="form-group">
                <label class="label" for="title">Title</label>
                <input class="input" id="title" name="title" type="text" required value="${escapeAttr(
                  title
                )}" />
              </div>
              <div class="form-group">
                <label class="label" for="content">Content</label>
                <textarea class="textarea" id="content" name="content" required>${escapeHTML(
                  content
                )}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label" for="tags">Tags</label>
                  <input class="input" id="tags" name="tags" type="text" value="${escapeAttr(
                    tags
                  )}" />
                  <p class="helper">Comma-separated</p>
                </div>
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
        const title = (fd.get("title") || "").toString().trim();
        const content = (fd.get("content") || "").toString();
        const tagsStr = (fd.get("tags") || "").toString();
        const tags = tagsStr
          ? tagsStr
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        try {
          await fetchJSON(`/posts/${encodeURIComponent(id)}`, {
            method: "PATCH",
            auth: true,
            body: { title, content, tags },
          });
          toast("Post updated", "ok");
          toHash(`#/post/${id}`);
        } catch (err) {
          toast(err.message || "Failed to update", "err");
        }
      });
    } catch (err) {
      toast(err.message || "Failed to load post", "err");
      toHash("#/");
    } finally {
      setBusy(false);
    }
  }

  // --- Logout ---
  async function doLogout() {
    try {
      await fetchJSON("/auth/logout", { method: "POST", auth: true }).catch(
        () => {}
      );
    } finally {
      storage.clearToken();
      storage.clearUser();
      updateNav();
      toast("Logged out", "ok");
      toHash("#/");
    }
  }

  // --- Router core ---
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
          <h2 style="margin:0 0 8px;">Not found</h2>
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
    if (!location.hash) location.hash = "#/"; // default
    route();

    // Keyboard: g then h to go home
    let keySeq = [];
    window.addEventListener("keydown", (e) => {
      keySeq.push(e.key.toLowerCase());
      keySeq = keySeq.slice(-2);
      if (keySeq.join("") === "gh") toHash("#/");
    });
  });
})();
