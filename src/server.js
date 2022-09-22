require('dotenv').config();

const Hapi = require('@hapi/hapi');

// eslint-disable-next-line no-unused-vars
const Jwt = require('@hapi/jwt');

// album
const albums = require('./api/albums'); // ALBUM PLUGIN
const AlbumService = require('./services/postgres/AlbumService');
const AlbumsValidator = require('./validator/albums');

// song
const song = require('./api/song'); // song PLUGIN
const SongService = require('./services/postgres/SongService');
const SongValidator = require('./validator/song');

// user
const users = require('./api/users'); // user PLUGIN
const UserService = require('./services/postgres/UsersService');
const UserValidator = require('./validator/users');

// authenttication
const authentications = require('./api/authentications'); // looking for index.js
const AuthenticationsService = require('./services/postgres/AuthenticationsService'); // need to be passed
const TokenManager = require('./tokenize/TokenManager'); // need to be passed in plugin register
const AuthenticationsValidator = require('./validator/authentications'); // will be passed

// playlist
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistValidator = require('./validator/playlists');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

const init = async () => {
  // init Service
  const userService = new UserService();
  const collaborationsService = new CollaborationsService(userService);
  const songService = new SongService();
  const playlistsService = new PlaylistsService(songService, collaborationsService);
  const albumService = new AlbumService();
  const authenticationService = new AuthenticationsService();

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
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
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
    {
      plugin: users,
      options: {
        service: userService,
        validator: UserValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationService,
        userService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
