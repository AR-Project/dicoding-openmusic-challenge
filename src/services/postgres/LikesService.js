const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');

class LikesService {
  constructor(cacheService) {
    this._pool = new Pool();

    // init
    this._cacheService = cacheService;
  }

  async verifyAlbum(albumId) {
    // prep query: too much hasle importing albumService here,
    // for further optimizing, this class method need to moved into albumService class
    const albumQuery = {
      text: `SELECT * 
        FROM albums 
        WHERE id = $1`,
      values: [albumId],
    };

    // run query
    const result = await this._pool.query(albumQuery);

    // verify result
    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async likeStatus(albumId, userId) {
    // verify validity of albumId
    await this.verifyAlbum(albumId);

    // prep query: using COUNT(*) for counting total rows. Because the result must be
    //    either zero or one. Also used this count result for function branching
    const query = {
      text: `SELECT COUNT(*)
        FROM user_album_likes
        WHERE album_id = $1 AND user_id = $2`,
      values: [albumId, userId],
    };
    // run query, fetch result into status var
    const status = await this._pool.query(query);

    // "Cache Feature" : delete keys from reddis cache first. Data in db WILL be modified below
    await this._cacheService.delete(`likes:${albumId}`);

    // branching by check count result.
    if (status.rows[0].count === '0') { // '0' == info is NOT found
      await this.likeAlbum(albumId, userId); // action taken: 'like album'
    }

    if (status.rows[0].count === '1') { // '1' == info is FOUND
      await this.dislikeAlbum(albumId, userId); // action taken: 'dislike/remove like album'
    }

    // TODO for optimizing: catch error if result neither 0 or 1
  }

  async likeAlbum(albumId, userId) {
    // generate likeId
    const likeId = `like-${nanoid(16)}`;

    // prep query: create new rows in user_album_likes
    const query = {
      text: `INSERT INTO user_album_likes(id, user_id, album_id)
        VALUES ($1, $2, $3)`,
      values: [likeId, userId, albumId],
    };

    // run query
    await this._pool.query(query);
  }

  async dislikeAlbum(albumId, userId) {
    // prep query: DELETE rows using albumId and UserId
    const query = {
      text: `DELETE FROM user_album_likes
        WHERE album_id = $1 AND user_id = $2`,
      values: [albumId, userId],
    };

    // run query
    await this._pool.query(query);
  }

  async getLikesNumber(albumId) {
    // TRYING to fetch data fron cache FIRST
    try {
      // fetch data from cache, will throw error if data not found
      const likes = await this._cacheService.get(`likes:${albumId}`);

      // return likes value inside object Per requirement, to track the data source (is cache or db)
      return {
        likes,
        isCache: true, // set cache flag to true;
      };

      // contain error from cacheService in this block, if no error, class method ends here
    } catch (error) { // continue the method if error detected
      // prep query: COUNT rows using albumId
      const query = {
        text: `SELECT COUNT(*) 
          FROM user_album_likes
          WHERE album_id = $1`,
        values: [albumId],
      };

      // run query
      const result = await this._pool.query(query);

      // convert result from string when coming from db to int
      const likes = parseInt(result.rows[0].count, 10);

      // "Cache Feature" : set new keys inside redis cache
      await this._cacheService.set(`likes:${albumId}`, likes);
      return {
        likes,
      };
    }
  }
}

module.exports = LikesService;
