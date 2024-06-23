//imports
var bcrypt = require("bcrypt");
var jwtUtils = require("../utils/jwt.utils");
var models = require("../models");
var asyncLib = require("async");

//constants

// prettier-ignore
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// prettier-ignore
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/;
//routes
module.exports = {
  register: function (req, res) {
    //params
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var bio = req.body.bio;

    //TODO verify pseudo length ,email regex, password ect ..
    if (email == null || username == null || password == null) {
      return res.status(400).json({ error: "missing parameters" });
    }

    if (username.length >= 13 || username.length <= 4) {
      return res
        .status(400)
        .json({ error: "Invalid username  (must be length 5 - 12 )" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error:
          "Password must be between 4 and 8 digits long and include at least one numeric digit.",
      });
    }

    asyncLib.waterfall(
      [
        (done) => {
          models.User.findOne({
            attributes: ["email"],
            where: { email: email },
          })
            .then((userFund) => {
              done(null, userFund);
            })
            .catch((err) => {
              res.status(500).json({ error: "unable to verify user" });
            });
        },
        (userFund, done) => {
          if (!userFund) {
            bcrypt.hash(password, 5, (err, bcryptPasword) => {
              done(null, userFund, bcryptPasword);
            });
          } else {
            return res.status(409).json({ error: "user already exist" });
          }
        },
        (userFund, bcryptPasword, done) => {
          models.User.create({
            email: email,
            username: username,
            password: bcryptPasword,
            bio: bio,
            isAdmin: 0,
          })
            .then(function (newUser) {
              done(newUser);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "canot add user" });
            });
        },
      ],
      (newUser) => {
        if (newUser) {
          return res.status(201).json({ userId: newUser.id });
        } else {
          return res.status(500).json({ error: "canot add user" });
        }
      }
    );
  },

  login: function (req, res) {
    //params
    var email = req.body.email;
    var password = req.body.password;

    if (email == null || password == null) {
      return res.status(400).json({ error: "missing parameters" });
    }

    //proceder

    asyncLib.waterfall(
      [
        (next) => {
          models.User.findOne({ where: { email: email } })
            .then((userFund) => {
              next(null, userFund);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable verify user" });
            });
        },
        (userFund, next) => {
          if (userFund) {
            bcrypt.compare(
              password,
              userFund.password,
              (errBcrypt, resBcrypt) => {
                next(userFund, resBcrypt);
              }
            );
          } else {
            return res.status(404).json({ error: "User not exists in DB" });
          }
        },
      ],
      (userFund, resBcrypt) => {
        if (resBcrypt) {
          return res.status(200).json({
            userId: userFund.id,
            token: jwtUtils.generateTokenForUser(userFund),
          });
        } else {
          return res.status(404).json({ error: "invalid password" });
        }
      }
    );
  },
  getUserProfile: (req, res) => {
    //Geting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(404).json({ error: "wrong token" });
    }

    models.User.findOne({
      attributes: ["id", "email", "username", "bio"],
      where: { id: userId },
    })
      .then((user) => {
        if (user) {
          return res.status(200).json(user);
        } else {
          return res.status(404).json({ error: "User not found" });
        }
      })
      .catch((err) => {
        return res.status(500).json({ error: "can't fetch user" });
      });
  },
  updateUserProfile: (req, res) => {
    //params
    var bio = req.body.bio;

    //Geting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(404).json({ error: "wrong token" });
    }
    asyncLib.waterfall(
      [
        (next) => {
          models.User.findOne({
            attributes: ["id", "bio", "username", "email"],
            where: { id: userId },
          })
            .then((userFound) => {
              next(null, userFound);
            })
            .catch((err) => {
              return res.status(500).json({ error: "can't fetch user" });
            });
        },
        (userFound, next) => {
          if (userFound) {
            userFound
              .update({ bio: bio ? bio : userFound.bio })
              .then(() => {
                next(userFound);
              })
              .catch((err) => {
                return res
                  .status(500)
                  .json({ error: "can't update user profiles" });
              });
          } else {
            return res.status(404).json({ error: "user not found" });
          }
        },
      ],
      (user) => {
        if (user) {
          return res.status(201).json(user);
        } else {
          return res.status(500).json({ error: "can't update user profiles" });
        }
      }
    );
  },
};
