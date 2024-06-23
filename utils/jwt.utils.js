//imports
const { tryEach } = require("async");
var jwt = require("jsonwebtoken");

//exports functions

const JWT_SIGN_SECRET = `XCuRQ@aJo4:WJ81OT%z3kH^(z4},Gb/tu^Y&o^V"Cl1HTHAeuI^dz'D,<phS3`;

module.exports = {
  generateTokenForUser: (userData) => {
    return jwt.sign(
      {
        userId: userData.id,
        isAdmin: userData.isAdmin,
      },
      JWT_SIGN_SECRET,
      {
        expiresIn: "72h",
      }
    );
  },
  parseAuthorization: (authorization) => {
    return authorization != null ? authorization.replace("Bearer ", "") : null;
  },
  getUserId: (authorization) => {
    var userId = -1;
    var token = module.exports.parseAuthorization(authorization);
    if (token) {
      try {
        var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
        if (jwtToken) {
          return (userId = jwtToken.userId);
        }
      } catch (error) {
        throw new Error(error);
      }
    }
    return userId;
  },
};
