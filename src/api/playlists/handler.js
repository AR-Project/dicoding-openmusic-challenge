class PlaylistHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistHandler = this.getPlaylistHandler.bind(this);
    this.deletePlaylistHandler = this.deletePlaylistHandler.bind(this);
    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongHandler = this.getPlaylistSongHandler.bind(this);
    this.deletePlaylistSongHandler = this.deletePlaylistSongHandler.bind(this);
    this.getActivities = this.getActivities.bind(this);
  }

  async postPlaylistHandler(request, h) {
    // validate payload
    this._validator.validatePlaylistPayload(request.payload);

    // parse payload and destruct userID from credential object
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    // generate new playlist, pass data via service/Playlists, expect return value
    const playlistId = await this._service.addPlaylist({
      name, owner: credentialId,
    });

    // return playlistId back to user
    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201); // change response code from default 200 to 201
    return response;
  }

  async getPlaylistHandler(request) {
    // destruct userID from credential object
    const { id: credentialId } = request.auth.credentials;

    // fetch playlist from db via service/Playlist
    const playlists = await this._service.getPlaylists(credentialId);

    // return playlists back to user
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistHandler(request) {
    // parse params and destruct userID from credential object
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    // validate if credentialID is valid user for current playlistId via service/Playlists
    await this._service.verifyPlaylistOwner(playlistId, credentialId);

    // finally delete playlist row from db via service/Playlists
    await this._service.deletePlaylistById(playlistId);

    // pass back data to user
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postPlaylistSongHandler(request, h) {
    // validate payload via validator/playlists
    this._validator.validatePlaylistSongPayload(request.payload);

    // destructure and parse data
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    // validate if credentialID is valid user for current playlistId via service/Playlists
    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    // add new song via service/pg/songs
    await this._service.addSongToPlaylist(playlistId, songId, credentialId);

    // init response
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke Playlist',
    });
    response.code(201); // change response code - adding new data
    return response;
  }

  async getPlaylistSongHandler(request) {
    // destructure and parse data
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    // validate if credentialID is has access for current playlistId via service/Playlists
    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    // fetch a playlist with its own song via service/pg/Playlists
    const playlist = await this._service.getSongFromPlaylist(playlistId);

    // pass playlist back to user
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongHandler(request) {
    // Validate payload first
    this._validator.validatePlaylistSongPayload(request.payload);

    // destructure and parse data
    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    // validate if credentialID is has access for current playlistId via service/Playlists
    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    // delete rows from playlist_song table via service/pg/Playlists
    await this._service.deleteSongFromPlaylist(playlistId, songId, credentialId);

    // notify user
    return {
      status: 'success',
      message: 'Lagu dalam playlist berhasil dihapus',
    };
  }

  async getActivities(request) {
    // destructure and parse data
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    // validate if credentialID is has access for current playlistId via service/Playlists
    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    // fetch activites from user via service/pg/Playlists
    const activities = await this._service.getActivities(playlistId);

    // return playlistId and its activities back to user
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistHandler;
