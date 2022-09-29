const autoBind = require('auto-bind');

class UploadsHandler {
  constructor(service, validator, albumService) {
    this._service = service;
    this._validator = validator;
    this._albumService = albumService;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    // parse data both from payload and request
    const { cover } = request.payload;
    const { id: albumId } = request.params;

    // validate header image, passing cover.hapi json
    // note: hapi.header contains filename and content-type
    this._validator.validateImageHeaders(cover.hapi.headers);

    // extract extension from file name.
    const ext = cover.hapi.filename.match(/(\.\w+$)/igm)[0];

    // pass cover via service/storage/StorageService, with albumId and extention
    const filename = await this._service.writeFile(cover, albumId, ext);

    // generate url for current cover
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;

    // pass url for stored in db via service/pg/AlbumService, passing coverUrl and albumId
    await this._albumService.postCover(coverUrl, albumId);

    // generate response per requirement
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201); // change response code per requirement
    return response;
  }
}

module.exports = UploadsHandler;
