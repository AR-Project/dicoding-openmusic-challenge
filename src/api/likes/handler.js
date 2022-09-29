const autoBind = require('auto-bind');

class LikesHandler {
  constructor(service) {
    this._service = service;

    autoBind(this);
  }

  async postLikeHandler(request, h) {
    // parse params and auth for albumId and userId
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    // pass data via /service/pg/LikeService
    await this._service.likeStatus(albumId, userId);

    // generate new response
    const response = h.response({
      status: 'success',
      message: 'like / dislike telah tercatat',
    });
    response.code(201); // change code
    return response;
  }

  async getLikesHandler(request, h) {
    // parse params for albumId
    const { id: albumId } = request.params;

    // pass albumId to LikesService, expect return object
    const { likes, isCache } = await this._service.getLikesNumber(albumId);

    // generate default response
    const response = h.response({
      status: 'success',
      data: {
        likes: parseInt(likes, 10),
      },
    });

    // check isCache value coming from LikesService
    if (isCache) {
      response.header('X-Data-Source', 'cache'); // make custom response header
    }

    // return response
    return response;
  }
}

module.exports = LikesHandler;
