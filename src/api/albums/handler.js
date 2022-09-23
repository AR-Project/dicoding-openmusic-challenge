class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    // parse payload
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    // pass parsed data to albumService
    const albumId = await this._service.addAlbum({ name, year });

    // init response
    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201); // change response code
    return response;
  }

  async getAlbumByIdHandler(request) {
    // parse params
    const { id } = request.params;

    // pass parsed data to albumService
    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    // validate payload via validator/album
    this._validator.validateAlbumPayload(request.payload);

    // parse params
    const { id } = request.params;

    // pass to parsed data to albumService
    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    // parse params
    const { id } = request.params;

    // pass parsed data to albumService
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }
}

module.exports = AlbumsHandler;
