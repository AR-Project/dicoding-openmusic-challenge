/* eslint-disable no-unused-vars */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const ClientError = require('../../exceptions/ClientError');

class PlaylistsService {
  constructor(songService, collaborationsService) {
    this._pool = new Pool();
    this._songService = songService;
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists(id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
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

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    // song validation
    await this._songService.getSongById(songId);

    const id = `playlist_songs-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO playlist_songs(id, playlist_id, song_id)
        VALUES ($1, $2, $3) RETURNING id`,
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    // for activity feature
    const activityId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const activityQuery = {
      text: `INSERT 
      INTO playlist_song_activities(id, playlist_id, song_id, user_id, action, time)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, userId, 'add', time],
    };

    await this._pool.query(activityQuery);
  }

  async getSongFromPlaylist(playlistId) {
    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, username 
      FROM playlists LEFT JOIN users ON playlists.owner = users.id 
      WHERE playlists.id = $1`,
      values: [playlistId],
    };
    const playlistResult = await this._pool.query(playlistQuery);
    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer 
        FROM playlist_songs 
        LEFT JOIN songs 
        ON playlist_songs.song_id = songs.id
        WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };
    const songsResult = await this._pool.query(songsQuery);
    playlistResult.rows[0].songs = songsResult.rows;
    return playlistResult.rows[0];
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const query = {
      text: `DELETE FROM playlist_songs
        WHERE playlist_id = $1 AND song_id = $2
        RETURNING id`,
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus');
    }
    // for activity feature
    const activityId = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const activityQuery = {
      text: `INSERT 
      INTO playlist_song_activities(id, playlist_id, song_id, user_id, action, time)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, userId, 'delete', time],
    };

    await this._pool.query(activityQuery);
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1', // id playlist
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService
          .verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async getActivities(playlistId) {
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
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = PlaylistsService;
