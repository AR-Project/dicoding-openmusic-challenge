class CollaborationsHandler {
  constructor(collaborationsService, playlistService, validator) {
    this._collaborationsService = collaborationsService;
    this._playlistService = playlistService;
    this._validator = validator;

    // bind method
    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    // validate payload via validator/collaborations
    this._validator.validateCollaborationPayload(request.payload);

    // destruct credentials object and parse payload
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    // verify if current userID is valid owner of playlistID via service/PlaylistService
    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);

    // push data into db via service/CollaborationService, expect a return value
    const collaborationId = await this._collaborationsService
      .addCollaboration(playlistId, userId);

    // pass collaborationId back to user, with message
    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil ditambahkan',
      data: {
        collaborationId,
      },
    });
    response.code(201); // change response code, changing something in db
    return response;
  }

  async deleteCollaborationHandler(request) {
    // validate payload via validator/collaborations
    this._validator.validateCollaborationPayload(request.payload);

    // destruct credentials object and parse payload
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    // verify if current userID is valid owner of playlistID via service/PlaylistService
    await this._playlistService.verifyPlaylistOwner(playlistId, credentialId);

    // remove the row in collaboration table via service/collaborationService
    await this._collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
