const Jwt = require('@hapi/jwt');
const InvariantError = require('../exceptions/InvariantError');

const TokenManager = {
  // -- personal note: token is a simple json object contain userId BUT DECODED using base64.
  // ---- Payload below is contain user id that generated by this app while user register

  generateAccessToken: (payload) => Jwt.token.generate(payload, process.env.ACCESS_TOKEN_KEY),
  generateRefreshToken: (payload) => Jwt.token.generate(payload, process.env.REFRESH_TOKEN_KEY),
  verifyRefreshToken: (refreshToken) => {
    try {
      // convert token (random string) to an object
      const artifacts = Jwt.token.decode(refreshToken);

      // pass artifact object to verifySignature method -- throw error if signature invalid
      Jwt.token.verifySignature(artifacts, process.env.REFRESH_TOKEN_KEY);

      // destructure artifacts object, only take decoded decoded payload, that contain id and iat
      const { payload } = artifacts.decoded;

      // return a slice of payload object, not as a whole
      return payload;
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid');
    }
  },
};

module.exports = TokenManager;
