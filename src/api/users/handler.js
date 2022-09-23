class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    // binding
    this.postUserHandler = this.postUserHandler.bind(this);
  }

  async postUserHandler(request, h) {
    // validate payload via validator/users
    this._validator.validateUserPayload(request.payload);

    // destructure payload object - gather information from client
    const { username, password, fullname } = request.payload;

    // passing all info via service/pg/users to be add into db
    const userId = await this._service.addUser({
      username, password, fullname,
    });

    // notify user, pass userId back to client
    const response = h.response({
      status: 'success',
      message: 'User berhasil ditambahkan',
      data: {
        userId,
      },
    });
    response.code(201); // change code, adding new data
    return response;
  }
}

module.exports = UsersHandler;
