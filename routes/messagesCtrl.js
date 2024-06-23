//imports
var jwtUtils = require("../utils/jwt.utils");
var models = require("../models");
var asyncLib = require("async");

//constants

//routes

module.exports = {
  createMessage: (req, res) => {
    //params
    var title = req.body.title;
    var content = req.body.content;
    var headerAuthor = req.headers["authorization"];

    userId = jwtUtils.getUserId(headerAuthor);
    if (userId < 0) {
      return res.status(404).json({ error: "Wrong token" });
    }

    if (title == null || content == null) {
      return res.status(404).json({ error: "missing parameters" });
    }
    if (title.length <= 5 || title.length >= 120) {
      return res
        .status(404)
        .json({ error: "Invalid title (must be length 4 - 120)" });
    }
    if (content.length <= 5) {
      return res
        .status(404)
        .json({ error: "Invalid title (must be length more than 5)" });
    }

    asyncLib.waterfall(
      [
        (next) => {
          models.User.findOne({ where: { id: userId } })
            .then((userFound) => {
              next(null, userFound);
            })
            .catch((err) => {
              return res.status(500).json({ error: "can not fetch user" });
            });
        },
        (userFound, next) => {
          if (userFound) {
            models.Message.create({
              title: title,
              content: content,
              likes: 0,
              UserId: userId,
            })
              .then((newMessage) => {
                next(newMessage);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "can not create message" });
              });
          } else {
            return res.status(500).json({ error: "user not found" });
          }
        },
      ],
      (newMessage) => {
        if (newMessage) {
          return res.status(201).json(newMessage);
        } else {
          return res.status(500).json({ error: "can not create message" });
        }
      }
    );
  },
  listMessages: (req, res) => {
    var order = req.query.order;
    var limit = req.query.limit;
    var offset = req.query.offset;
    var fields = req.query.fields;

    models.Message.findAll({
      order: [order ? order.split(":") : ["title", "ASC"]],
      attributes: fields != "*" && fields != null ? fields.split(",") : null,
      limit: !isNaN(limit) ? parseInt(limit) : null,
      offset: !isNaN(offset) ? parseInt(offset) : null,
      include: [
        {
          model: models.User,
          attributes: ["username"],
        },
      ],
    })
      .then((messages) => {
        return res.status(201).json(messages);
      })
      .catch((err) => {
        return res.status(500).json({ error: "can not fetch messages" });
      });
  },
};
