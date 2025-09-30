# Auth

1. POST /auth/signup
2. POST /auth/login
3. POST /auth/logout

# post

4. POST /post/create
5. PATCH /post/update/:postID
6. DELETE /post/:postID

7. GET /post/all? (includes pagination, filter & search)
   e.g: GET /post/all?page=1&limit=10&search=js&tags=node,express

**Features:**
Pagination: page, limit.
Search: match title or content with regex.
Filter: filter by tags.
Sort: newest first (default).

8. GET /post/:postID

9. PATCH /post/:postID/like/:userID (If a user already liked → remove like, If not → add like.)
10. GET /post/:postID/likes/count

# comment

11. POST /comment/:userID/:postID
12. GET /comment/:postID?page=1&limit=3 (i.e. displaying comments of a specific post with pagination)
13. DELETE /comments/:postID/deletecomments/:commentID (can be done by comment's author only)
