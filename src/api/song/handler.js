const ClientError = require('../../exceptions/ClientError');

class SongHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    // bind for song handler
    this.postSongHandler = this.postSongHandler.bind(this);
    this.getSongsHandler = this.getSongsHandler.bind(this);
    this.getSongByIdHandler = this.getSongByIdHandler.bind(this);
    this.putSongByIdHandler = this.putSongByIdHandler.bind(this);
    this.deleteSongByIdHandler = this.deleteSongByIdHandler.bind(this);
  }

  // Start of SongHandler Method
  async postSongHandler(request, h) {
    try {
      // handler init - pass all payload to validator
      this._validator.validateSongPayload(request.payload);

      // deconstruc payload
      const {
        title, year, genre, performer, duration, albumId,
      } = request.payload;

      // Pass data to noteService
      const songId = await this._service.addSong({
        title, year, genre, performer, duration, albumId,
      });

      // init success response
      const response = h.response({
        status: 'success',
        message: 'Lagu berhasil ditambahkan',
        data: {
          songId,
        },
      });

      // change default code
      response.code(201);
      return response;
    } catch (error) {
      // User Error
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server error
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getSongsHandler(request) {
    // pass data (with query if it exist) to openMusic service
    const songs = await this._service.getSongs(request.query);
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    try {
      // init handler
      const { id } = request.params;

      // pass data to open service, store return value ini song variable
      const song = await this._service.getSongById(id);
      return {
        status: 'success',
        data: {
          song,
        },
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putSongByIdHandler(request, h) {
    try {
      // pass ALL payload into song validator
      this._validator.validateSongPayload(request.payload);

      // destructure params
      const { id } = request.params;

      // pass data into service
      await this._service.editSongById(id, request.payload);
      return {
        status: 'success',
        message: 'Lagu berhasil diperbarui',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteSongByIdHandler(request, h) {
    try {
      // handler init - destructuring request.params object
      const { id } = request.params;

      // pass data to service
      await this._service.deleteSongById(id);
      return {
        status: 'success',
        message: 'Lagu berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = SongHandler;
