/*
    (**) HTTP method
        GET 
        POST
        PUT
        PATCH
        DELETE
            - soft delete => PUT
            - hard delete => DELETE
    
    (**) HTTP Status code
        2xx: 200, 201, 204... => Successfully
        4xx: 400, 401, 403,400... => Client error
        5xx: 500 => Server error

    (**) RESTful API
    (**) Resources: posts
        Base URL: http://localhost:3001/api/v1/
        + Get all posts: (R - Read)
            . /posts
            . Method: GET 

        + Get post by id (R - Read)
            . /posts/:id
            . Method: GET

        + Create post (C - Create)
            . Method: POST
            . /posts
            . request body

        + Update post by id (U - Update)
            . Method: PUT/PATCH
            . /posts/:id
            . request body

        + Delete post by id (D - Delete)
            . Method: DELETE
            . /posts/:id

       C------R--------U-----------D
    Post     GET    PUT/PATCH   Delete

    (**) Request params, request query, request body
    
    - Query 
        . API: http://localhost:3001/api/v1/posts?page=1&size=50
        . Method: GET
        . req.query:
            {   
               page: 1,
               size: 50
            }
    
    - Params:
        . API: http://localhost:3001/api/v1/posts/:id
        . id -> param
    
    - Request body: Post, Put, Patch
*/
