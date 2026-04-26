// utils/generateToken.js
// Purpose: Creates a JWT (JSON Web Token) for an authenticated user.
// JWT = a signed, encoded string that proves "this user is logged in"
// without storing sessions on the server. Stateless auth.

const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  // jwt.sign(payload, secret, options)
  // payload = data we put inside the token (here: user's ID)
  // secret = used to sign the token; only our server knows it
  // expiresIn = token validity period
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;