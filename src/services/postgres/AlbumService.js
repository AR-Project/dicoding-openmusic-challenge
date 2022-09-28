const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumDBtoModel } = require('../utils');

class AlbumService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    // generate id for new album
    const id = `album-${nanoid(16)}`;

    // prepare query
    const query = {
      text: 'INSERT INTO albums(id, name, year) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    // run query and fetch result
    const result = await this._pool.query(query);

    // check if successfully inserted
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    // return id
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    // prepare query: fetch album using albumId
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    // prepare query: fetch songs using albumId
    const songQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    // run both query at the same time.
    const albumResult = await this._pool.query(query);
    const songsResult = await this._pool.query(songQuery);

    // validate albumResult, note: no need to validate songResult
    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // map from albums tables to requirement model
    const mappedAlbumResult = mapAlbumDBtoModel(albumResult.rows[0]);

    // merge songResult rows INTO albumResult
    mappedAlbumResult.songs = songsResult.rows; // <== THIS LINE IS CRUCIAL!!

    // giving back albumResult that has songResult in it
    return mappedAlbumResult;
  }

  async editAlbumById(id, { name, year }) {
    // prepare query
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    // run query - updating data on db
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    // prepare query
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    // run query
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }
  }

  async postCover(coverUrl, albumId) {
    // prep query: always overwrite data everytime post request is coming
    const query = {
      text: `UPDATE albums 
        SET cover_url = $1 
        WHERE id = $2
      `,
      values: [coverUrl, albumId],
    };

    // no need to validate for now
    await this._pool.query(query);
  }
}

module.exports = AlbumService;
