# Auth

1. POST /auth/signup
2. POST /auth/login
3. POST /auth/logout

# Posts

4. POST /posts
5. GET /posts?page=1&limit=10&search=js&tags=node,express
6. GET /posts/:postID
7. PATCH /posts/:postID
8. DELETE /posts/:postID

# comments

9. POST /posts/:postID/comments
10. GET /posts/:postID/comments?page=1&limit=3
11. DELETE /posts/:postID/comments/:commentID

# Likes

12. POST /posts/:postID/like
13. GET /posts/:postID/likes/count
