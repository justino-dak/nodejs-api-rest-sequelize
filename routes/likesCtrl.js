//imports
var jwtUtils = require("../utils/jwt.utils");
var models = require("../models");
var asyncLib = require("async");
const user = require("../models/user");

//constatnts
const LIKED = 1;
const DISLIKED = 0;

//routes
module.exports = {
  likePost: (req, res) => {
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    var messageId = parseInt(req.params.messageId);
    if (userId < 0) {
      return res.status(500).json({ error: "wrong token" });
    }
    if (messageId <= 0) {
      return res.status(500).json({ error: "Missing parameter" });
    }

    asyncLib.waterfall(
      [
        (next) => {
          models.Message.findOne({ where: { id: messageId } })
            .then((messageFound) => {
              next(null, messageFound);
            })
            .catch((err) => {
              console.log(err);
              return res
                .status(500)
                .json({ error: "..unable to fetch message" });
            });
        },
        (messageFound, next) => {
          if (messageFound) {
            models.User.findOne({ where: { id: userId } })
              .then((userFound) => {
                next(null, messageFound, userFound);
              })
              .catch((err) => {
                return res.status(500).json({ error: "unable to verify user" });
              });
          } else {
            return res.status(500).json({ error: "message not found" });
          }
        },
        (messageFound, userFound, next) => {
          if (userFound) {
            models.Like.findOne({
              where: {
                messageId: messageId,
                userId: userId,
              },
            })
              .then((isUserAlreadyLiked) => {
                next(null, messageFound, userFound, isUserAlreadyLiked);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "Can not check user's reaction" });
              });
          } else {
            return res.status(500).json({ error: "User do not exists" });
          }
        },
        (messageFound, userFound, isUserAlreadyLiked, next) => {
          if (!isUserAlreadyLiked) {
            messageFound
              .addUser(userFound, { isLiked: LIKED })
              .then((alreadyLikedFound) => {
                next(null, messageFound, userFound, isUserAlreadyLiked);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "unable to set user reaction" });
              });
          } else {
            if (isUserAlreadyLiked.isLiked !== LIKED) {
              isUserAlreadyLiked
                .update({ isLiked: LIKED })
                .then(() => {
                  next(messageFound, userFound, isUserAlreadyLiked);
                })
                .catch((err) => {
                  return res
                    .status(500)
                    .json({ error: "Unable to update isLiked" });
                });
            } else {
              return res.status(500).json({ error: "message already liked" });
            }
          }
        },
        (messageFound, userFound, isUserAlreadyLiked, next) => {
          messageFound
            .update({ likes: messageFound.likes + 1 })
            .then((messageFound) => {
              next(messageFound);
            })
            .catch((err) => {
              return res
                .status(500)
                .json({ error: "unable to update message likes counter" });
            });
        },
      ],
      (messageFound) => {
        if (messageFound) {
          return res.status(201).json(messageFound);
        } else {
          return res.status(500).json({ error: "can not  update message" });
        }
      }
    );
  },
  disliskPost: (req, res) => {
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    var messageId = parseInt(req.params.messageId);
    if (userId < 0) {
      return res.status(500).json({ error: "wrong token" });
    }
    if (messageId <= 0) {
      return res.status(500).json({ error: "Missing parameters" });
    }

    asyncLib.waterfall(
      [
        (next) => {
          models.Message.findOne({ where: { id: messageId } })
            .then((messageFound) => {
              next(null, messageFound);
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({ error: "unable to fetch message" });
            });
        },
        (messageFound, next) => {
          if (messageFound) {
            models.User.findOne({ where: { id: userId } })
              .then((userFound) => {
                next(null, messageFound, userFound);
              })
              .catch((err) => {
                return res.status(500).json({ error: "unable to verify user" });
              });
          } else {
            return res.status(500).json({ error: "message not found" });
          }
        },
        (messageFound, userFound, next) => {
          if (userFound) {
            models.Like.findOne({
              where: {
                messageId: messageId,
                userId: userId,
              },
            })
              .then((isUserAlreadyDisliked) => {
                next(null, messageFound, userFound, isUserAlreadyDisliked);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "Can not check user's reaction" });
              });
          } else {
            return res.status(500).json({ error: "User do not exists" });
          }
        },
        (messageFound, userFound, isUserAlreadyDisliked, next) => {
          if (!isUserAlreadyDisliked) {
            messageFound
              .addUser(userFound, { isLiked: DISLIKED })
              .then(() => {
                next(null, messageFound, userFound, isUserAlreadyDisliked);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "unable to set user reaction" });
              });
          } else {
            if (isUserAlreadyDisliked.isLiked !== DISLIKED) {
              isUserAlreadyDisliked
                .update({ isLiked: DISLIKED })
                .then(() => {
                  next(messageFound, userFound, isUserAlreadyDisliked);
                })
                .catch((err) => {
                  return res
                    .status(500)
                    .json({ error: "Unable to update isLiked" });
                });
            } else {
              return res
                .status(500)
                .json({ error: "message already disliked" });
            }
          }
        },
        (messageFound, userFound, isUserAlreadyDisliked, next) => {
          messageFound
            .update({
              likes: messageFound.likes > 0 ? messageFound.likes - 1 : 0,
            })
            .then((messageFound) => {
              next(messageFound);
            })
            .catch((err) => {
              return res
                .status(500)
                .json({ error: "unable to update message likes counter" });
            });
        },
      ],
      (messageFound) => {
        if (messageFound) {
          return res.status(201).json(messageFound);
        } else {
          return res.status(500).json({ error: "can not  update message" });
        }
      }
    );
  },
};
