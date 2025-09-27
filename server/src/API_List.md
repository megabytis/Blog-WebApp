# Auth

POST /auth/signup
POST /auth/login
POST /auth/logout

# post

POST /post/create
PATCH /post/update/:postID
DELETE /post/delete/:postID

GET /post/all? (includes pagination, filter & search)
e.g: GET /post/all?page=1&limit=10&search=js&tags=node,express

**Features:**
Pagination: page, limit.
Search: match title or content with regex.
Filter: filter by tags.
Sort: newest first (default).

GET /post/:postID

# comment

/comment/:userID/:postID
/comment/:postID?page=1&limit=3 (agg pagination)
/comment/delete (can be done by comment's author only)

# like

/like/:userID/:postID (If a user already liked → remove like, If not → add like.)
/like/count
