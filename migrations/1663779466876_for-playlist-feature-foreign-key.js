exports.up = (pgm) => {
  pgm.addConstraint('playlists', 'fk_playlists.owner_user.id', 'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE');
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.playlist_song_playlists.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');
  pgm.addConstraint('playlist_songs', 'fk_playlist_song.song_songs.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropConstraint('playlists', 'fk_playlists.owner_user.id');
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.playlist_song_playlists.id');
  pgm.dropConstraint('playlist_songs', 'fk_playlist_song.song_songs.id');
};
