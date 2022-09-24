/* eslint-disable camelcase */

// exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('playlist_song_activities', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    action: {
      type: 'VARCHAR(10)',
      notNull: true,
    },
    time: {
      type: 'VARCHAR(30)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'playlist_song_activities',
    'fk_playlist_song_activities.playlists_playlist.id',
    `FOREIGN KEY(playlist_id) REFERENCES playlists(id)
    ON DELETE CASCADE`,
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint(
    'playlist_song_activities',
    'fk_playlist_song_activities.playlists_playlist.id',
  );
  pgm.dropTable('playlist_song_activities');
};
