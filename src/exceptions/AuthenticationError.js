const ClientError = require('./ClientError');

class AuthenticationError extends ClientError {
  constructor(message) {
    super(message, 401);
    this.name = 'Authentication Error';
  }
}

module.exports = AuthenticationError;
