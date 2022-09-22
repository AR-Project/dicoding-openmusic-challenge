const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  constructor(userService) {
    this._pool = new Pool();
    this._userService = userService;
  }

  async addCollaboration(playlistId, userId) {
    const id = `collab-${nanoid(16)}`;
    // validate if user id exist in database
    await this._userService.getUserById(userId);

    const query = {
      text: `INSERT 
        INTO collaborations(id, playlist_id, user_id) 
        VALUES($1, $2, $3) 
        RETURNING id`,
      values: [id, playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: `DELETE 
      FROM collaborations 
      WHERE playlist_id = $1 AND user_id = $2 
      RETURNING id`,
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: `SELECT * FROM collaborations 
        WHERE playlist_id = $1 AND user_id = $2`,
      values: [playlistId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }
}

module.exports = CollaborationsService;
