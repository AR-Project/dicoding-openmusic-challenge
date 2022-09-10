const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBtoModel } = require('../utils');

class OpenMusicService {
  constructor() {
    this._pool = new Pool(); // all parameter is fetched from .env by default
  }

  /**
   * START OF ALBUM service
   */
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

  /**
   * START OF SONG SERVICE
   */
  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    // generate id for new song
    const id = `song-${nanoid(16)}`;

    // prepare query for insert into songs table db
    const query = {
      text: 'INSERT INTO songs(id, title, year, genre, performer, duration, album_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    // run query and fetch result
    const result = await this._pool.query(query);

    // check if successfully inserted
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs(query) {
    // just simple function to wrap str with '%' for later use in postgresql query
    const wrap = (str) => `%${str}%`;

    // destructuring request.query passed from handler
    const { title, performer } = query;

    // wrap all query data
    const titleQuery = wrap(title);
    const performerQuery = wrap(performer);

    // default query
    let pgQuery = 'SELECT id, title, performer FROM songs';

    // in any query exist, default postgresql query will be replaced
    // this three if function feels redundant, need optimizing later
    if (title && performer) { // using both query
      pgQuery = {
        text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
        values: [titleQuery, performerQuery],
      };
    }
    if (!title && performer) { // only performer
      pgQuery = {
        text: 'SELECT id, title, performer FROM songs WHERE performer ILIKE $1',
        values: [performerQuery],
      };
    }
    if (title && !performer) { // only title
      pgQuery = {
        text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1',
        values: [titleQuery],
      };
    }

    // fetch data from db
    const result = await this._pool.query(pgQuery);

    // return data from result variable
    return result.rows;
  }

  async getSongById(id) {
    // init query data using id
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    // run query, fetch data into result
    const result = await this._pool.query(query);

    // result validation
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    // return result
    return result.rows.map(mapDBtoModel)[0];
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    // prepare query
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, id],
    };

    // run query
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    // prepare query
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    // run query
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = OpenMusicService;
