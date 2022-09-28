/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.addColumn('albums', {
    cover_url: {
      type: 'VARCHAR(100)',
      default: null,
    },
  });
  pgm.sql('UPDATE albums SET cover_url = NULL WHERE cover_url IS NULL');
};

exports.down = (pgm) => {
  pgm.dropColumn('albums', 'cover_url');
};
