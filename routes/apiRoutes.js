/* eslint-disable prettier/prettier */
var db = require("../models");
const jwt = require("jsonwebtoken");

module.exports = function(app) {
  // Get all categories
  app.get("/api/:category", function(req, res) {
    db.Post.findAll({ where: { category: req.params.category }}).then(function(dbExamples) {
      res.json(dbExamples);
    });
  });

  app.get("/api/user/:id", (req, res) => {
    let userPosts;
    let userComments;
    let userID = req.params.id;
    db.User.findOne({
      where: {
        id: userID
      }
    }).then(data => {
      db.Post.findAll({
        where:{
          UserId: userID
        }
      }).then(postData => {
        userPosts = postData.length;
        db.Comment.findAll({
          where: {
            UserId: userID
          }
        }).then(commentData => {
          userComments = commentData.length;
          const response = {
            userNa me: data.userName,
            memberSince: data.createdAt,
            // likes: data.likes,
            commentsMade: userComments,
            postsMade: userPosts
          };
          res.json(response);
        });
      });
    });
  });

  app.put("/api/updateFavorites", (req, res) => {
    console.log("this is runnning");
    db.User.update({
      favorites : req.body.newFavorites},
    {where: { id: req.body.UserId}}
    ).then(result => res.json(result));
  });

  //Create a new user
  app.post("/api/newUser", (req, res) => {
    console.log(req.body);
    db.User.findAll({
      where: {
        userName: req.body.name
      }
    }).then(data => {
      if (data.length > 0) {
        res.json({ newUser: false });
      } else {
        db.User.create({
          userName: req.body.name,
          email: req.body.email,
          password: req.body.password
        });
        res.json({ newUser: true });
      }
    });
  });

  // Create a new example
  app.post("/api/posts", verifyToken, (req, res) => {
    console.log(req.body);
    const requestData = JSON.parse(JSON.stringify(req.body));
    console.log(requestData);
    jwt.verify(req.token, "secretkey", (err, authData) => {
      console.log(authData);
      if (err) {
        res.sendStatus(403);
      }
    });
    db.Post.create({
      userName: req.body.userName,
      category: req.body.category,
      corntent: req.body.corntent,
      header: req.body.header,
      UserId: req.body.UserId
    }).then(function(dbExample) {
      console.log(dbExample);
      res.json({ postMade: true });
    });
  });

  app.post("/api/login", (req, res) => {
    console.log(req.body);
    db.User.findOne({
      where: {
        userName: req.body.userName,
        password: req.body.password
      }
    }).then(data => {
      console.log(data.dataValues);
      const favorites = data.favorites.split(",");
      user = {
        id: data.id,
        userName: data.dataValues.userName,
        email: data.dataValues.email,
        createdAt: data.dataValues.createdAt, 
        favorites: favorites
      };
      jwt.sign({ user }, "secretkey", (err, token) => {
        if (err) {
          throw err;
        } else {
          const data = [user, token];
          res.json({ data });
        }
      });
    });
  });

  app.post("/api/comment", (req,res) => {
    console.log(req.body);
    let comment = req.body;
    data = {
      PostId: comment.post,
      userName: comment.userName, 
      corntent: comment.corntent, 
      UserId: comment.UserId, 
      category: comment.category
    };
    db.Comment.create(data).then(() => {
      res.json({ postMade: true });
    });
  });

  // Delete an example by id
  app.delete("/api/examples/:id", function(req, res) {
    db.Example.destroy({ where: { id: req.params.id } }).then(function(
      dbExample
    ) {
      res.json(dbExample);
    });
  });
  function verifyToken(req, res, next) {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader !== "undefined") {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
      next();
    } else {
      res.sendStatus(403);
    }
  }
};
