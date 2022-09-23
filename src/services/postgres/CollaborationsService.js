const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  constructor(userService) {
    this._pool = new Pool(); // postgres db, need env
    this._userService = userService;
  }

  async addCollaboration(playlistId, userId) {
    // generate collabId
    const id = `collab-${nanoid(16)}`;

    // validate if userId exist in database. NOTE: need "./UserService"
    await this._userService.getUserById(userId);

    // prep query: add row into collaborations tables
    const query = {
      text: `INSERT 
        INTO collaborations(id, playlist_id, user_id) 
        VALUES($1, $2, $3) 
        RETURNING id`,
      values: [id, playlistId, userId],
    };

    // run query - fetch result for validation
    const result = await this._pool.query(query);

    // using result for validation
    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    // return collaborationsId only
    return result.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    // prep query: delete a row in collaboration tables using playlistID and userId
    const query = {
      text: `DELETE 
      FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2 
      RETURNING id`,
      values: [playlistId, userId],
    };

    // run query - fetch result for validation
    const result = await this._pool.query(query);

    // using result for validation
    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }
  }

  async verifyCollaborator(playlistId, userId) {
    // prep query: check if current userID exist in collaborations table
    const query = {
      text: `SELECT * FROM collaborations 
        WHERE playlist_id = $1 AND user_id = $2`,
      values: [playlistId, userId],
    };

    // run query - fetch result for validation
    const result = await this._pool.query(query);

    // using result for validation
    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }
}

module.exports = CollaborationsService;
