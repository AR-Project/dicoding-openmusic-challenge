const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(songService, collaborationsService) {
    this._pool = new Pool(); // postgres db, need env
    this._songService = songService;
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    // generate playlistId
    const id = `playlist-${nanoid(16)}`;

    // prep query: add a row into playlist table
    const query = {
      text: 'INSERT INTO playlists(id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    // run query and fetch result
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    // return playlistId only
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    /** prep query: first, fetch all data from playlist and 'LEFT JOIN' with collaborations and
     * store that result AS 'temp' table and link with playlist id. Now temp tables is LEFT JOIN
     * with users linking temp.owner and users table to get users.username. ADD condition last.
     * side note: temp table is already contain playlist ownerID and collaborator userID.
     *
     * TODO: optimize this query. Move WHERE condition inside temp tables, and group rows by
     * -- playlist id inside temp result. Maybe reduce memory usage in postgres service
     */
    const query = {
      text: `WITH temp AS 
        (
          SELECT playlists.*, collaborations.user_id 
          FROM playlists 
          LEFT JOIN collaborations 
          ON collaborations.playlist_id = playlists.id
        ) 
        SELECT temp.id, temp.name, users.username 
        FROM temp 
        LEFT JOIN users 
        ON temp.owner = users.id 
        WHERE temp.owner = $1 OR temp.user_id = $1;`,
      values: [owner],
    };

    // run query - fetch result
    const result = await this._pool.query(query);

    // return all playlist
    return result.rows;
  }

  async deletePlaylistById(id) {
    // prep query: delete a row from playlists table using playlistId
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    // run query - and fetch result
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    // validate songId first, if it exist or not
    await this._songService.getSongById(songId);

    // generate playlistSongId
    const id = `playlist_songs-${nanoid(16)}`;

    // prep query: add data into playlist_songs junction table
    const query = {
      text: `INSERT INTO playlist_songs(id, playlist_id, song_id)
        VALUES ($1, $2, $3) RETURNING id`,
      values: [id, playlistId, songId],
    };

    // run query - fetch result
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    /**   PLAYLIST ACTIVITES FEATURE  */

    // generate activityId and current date
    const activityId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    // prep query: add data to psa junction table
    const activityQuery = {
      text: `INSERT 
      INTO playlist_song_activities(id, playlist_id, song_id, user_id, action, time)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, userId, 'add', time],
    };

    // run query - all data is valid, no need to validate query input
    await this._pool.query(activityQuery);
  }

  async getSongFromPlaylist(playlistId) {
    // prep query: fetch playlist table and 'attach' users table, with link userId
    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, username 
      FROM playlists LEFT JOIN users ON playlists.owner = users.id 
      WHERE playlists.id = $1`,
      values: [playlistId],
    };

    // run query - fetch result
    const playlistResult = await this._pool.query(playlistQuery);

    // validate result: playlist exist or not
    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    /** prep query: fetch playlist_song tables,
     *      then 'attach' songs table, but only use songs.title and songs.performer */
    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer 
        FROM playlist_songs 
        LEFT JOIN songs 
        ON playlist_songs.song_id = songs.id
        WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    // run query - fetch data
    const songsResult = await this._pool.query(songsQuery);

    // merge songResult rows inside playlistResult object property
    playlistResult.rows[0].songs = songsResult.rows;

    // return playlistResult with songsResult contained
    return playlistResult.rows[0];
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    // prep query: delete a rows from playlist_songs
    const query = {
      text: `DELETE FROM playlist_songs
        WHERE playlist_id = $1 AND song_id = $2
        RETURNING id`,
      values: [playlistId, songId],
    };

    // run query - fetch result
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus');
    }
    /**   PLAYLIST ACTIVITES FEATURE  */

    // generate activityId and current time
    const activityId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    // prep query: insert a row to psa tables
    const activityQuery = {
      text: `INSERT 
      INTO playlist_song_activities(id, playlist_id, song_id, user_id, action, time)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, userId, 'delete', time],
    };

    // run query - no need to validate
    await this._pool.query(activityQuery);
  }

  async verifyPlaylistOwner(id, owner) {
    // prep query: fetch row from playlist using playlistId
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1', // id playlist
      values: [id],
    };

    // run query - fetch result
    const result = await this._pool.query(query);

    // validate result, if playlist is exsist or not
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    // store the FIRST fetched result playlist into playlist variable
    const playlist = result.rows[0];

    // compare playlist.owner with current userId
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      // first check if userId are the OWNER, will throw error if not
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      /** if function only catch NotFoundError. Other error for right now is being ignored. */
      if (error instanceof NotFoundError) {
        throw error;
      }

      // at this line, there is possibility AuthorizationError already throwed, but ignored
      try {
        // pass userId via service/collaborations, will throw invariant error if userId not valid
        await this._collaborationsService
          .verifyCollaborator(playlistId, userId);
      } catch {
        throw error; // dead end: just throw ANY error if exists
      }
    }
  }

  async getActivities(playlistId) {
    // prep query: using alias psa, fetch all rows in playlist_song_activities,
    // LEFT join by songs and users, but only take userId and songId, and then
    // filter the result using playlistId
    const query = {
      text: `
      WITH psa AS (SELECT * FROM playlist_song_activities) 
      SELECT users.username, songs.title, psa.action, psa.time 
      FROM psa 
      LEFT JOIN songs ON psa.song_id = songs.id 
      LEFT JOIN users ON psa.user_id = users.id 
      WHERE psa.playlist_id = $1;`,
      values: [playlistId],
    };
    // run query - fetch result
    const result = await this._pool.query(query);

    // return all activitiesResult
    return result.rows;
  }
}

module.exports = PlaylistsService;
