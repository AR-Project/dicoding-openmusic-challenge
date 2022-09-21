require('dotenv').config();

const Hapi = require('@hapi/hapi');
// album
const albums = require('./api/albums'); // ALBUM PLUGIN
const AlbumService = require('./services/postgres/AlbumService');
const AlbumsValidator = require('./validator/albums');

// song
const song = require('./api/song'); // song PLUGIN
const SongService = require('./services/postgres/SongService');
const SongValidator = require('./validator/song');

const init = async () => {
  // init Service
  const albumService = new AlbumService();
  const songService = new SongService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: song,
      options: {
        service: songService,
        validator: SongValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
