class AuthenticationHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    // change 'scope' of passed function/class
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    // binding
    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    /*   personal note: this handler dealing with user login     */

    // validate payload via validator/authentications
    this._validator.validatePostAuthenticationPayload(request.payload);

    // parse payload - destructure object
    const { username, password } = request.payload;

    // pass parsed data to service/postgres/UsersService
    const id = await this._usersService.verifyUserCredential(username, password);

    // generate new token from tokenize/TokenManager
    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    // only refreshToken alone is stored in db via service/postgres/AuthenticationService
    await this._authenticationsService.addRefreshToken(refreshToken);

    // return both accessToken and refreshToken to user
    const response = h.response({
      status: 'success',
      message: 'Authentication berhasil ditambahkan',
      data: {
        accessToken,
        refreshToken,
      },
    });

    response.code(201); // change response code
    return response;
  }

  async putAuthenticationHandler(request) {
    // validate payload via validator/authentications
    this._validator.validatePutAuthenticationPayload(request.payload);

    // parse payload -- destructuring object
    const { refreshToken } = request.payload;

    // validate refreshTokens via service/postgres/AuthenticationsService
    // -- note: this just compare user refreshToken with exist refreshToken on db
    await this._authenticationsService.verifyRefreshToken(refreshToken);

    // now VALID refreshToken is passed to tokenize/TokenManager to get userId
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

    // generate new accessToken
    const accessToken = this._tokenManager.generateAccessToken({ id });

    // give accessToken back to user
    return {
      status: 'success',
      message: 'Access Token berhasil diperbarui',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request) {
    /**    personal note: this used when user log out
     *     in summary, delete refresh token in the database
     */

    // validate payload via validator/authentications
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    // parse payload, destructure refresh token
    const { refreshToken } = request.payload;

    // validate refreshToken from user - throw error if invalid
    await this._authenticationsService.verifyRefreshToken(refreshToken);

    // finally delete refreshToken in database via service/postgres/AuthenticationService
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }
}

module.exports = AuthenticationHandler;
