const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

const DEBUG = false;
const pd = () => {
  if (DEBUG) {
    console.log('Run on new AlbumsService Plugin');
  }
};

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
    // DEBUG DEBUG DEBUG DEBUG
    pd();

    // return id
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    // prepare query, using id for fetching album
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    // prepare query, using id for fetching corespondent songs
    const songQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    // run both query, fetch data into result
    const result = await this._pool.query(query);
    const songResult = await this._pool.query(songQuery);

    // result validation - no need to validate song Result
    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // merge song result into result
    result.rows[0].songs = songResult.rows;

    // DEBUG DEBUG DEBUG DEBUG
    pd();

    return result.rows[0];
  }

  async editAlbumById(id, { name, year }) {
    // prepare query
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    // run query - fetch data from db
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
    // DEBUG DEBUG DEBUG DEBUG
    pd();
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

    // DEBUG DEBUG DEBUG DEBUG
    pd();
  }
}

module.exports = AlbumService;
