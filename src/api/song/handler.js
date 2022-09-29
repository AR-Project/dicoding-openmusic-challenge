const autoBind = require('auto-bind');

class SongHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    // validate payload via validator/songs
    this._validator.validateSongPayload(request.payload);

    // destructure payload,
    const {
      title, year, genre, performer, duration, albumId,
    } = request.payload;

    // add new song via service/pg/songs, expect a return songId
    const songId = await this._service.addSong({
      title, year, genre, performer, duration, albumId,
    });

    // notify user, and pass back songId
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });
    response.code(201); // change response code, add new data
    return response;
  }

  async getSongsHandler(request) {
    // fetch songs via service/pg/songs
    const songs = await this._service.getSongs(request.query);

    // pass data back to user
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    // parse params, destructure params object
    const { id } = request.params;

    // pass songId to service/pg/songs to get song data
    const song = await this._service.getSongById(id);

    // pass song data back to user;
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    // validate payload via validator/songs
    this._validator.validateSongPayload(request.payload);

    // destructure params object
    const { id } = request.params;

    // pass songID and request.payload (as whole object) via service/pg/songs
    await this._service.editSongById(id, request.payload);

    // notify user back
    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    // destructuring params object
    const { id } = request.params;

    // pass songId to service/pg/songs
    await this._service.deleteSongById(id);

    // notify user
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongHandler;
