# Auth

/auth/signup
/auth/login
/auth/logout

# post

/post/create
/post/read/single
/post/read/all (includes pagination, filter & search)
/post/update
/post/delete

# comment

/comment/:userID/:postID
/comment/:postID?page=1&limit=3 (agg pagination)
/comment/delete (can be done by comment's author only)

# like

/like/:userID/:postID (If a user already liked → remove like, If not → add like.)
/like/count
