require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

// error handling
const ClientError = require('./exceptions/ClientError');

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
const authentications = require('./api/authentications'); // authentication PLUGIN
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// playlist
const playlists = require('./api/playlists'); // playlist PLUGIN
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistValidator = require('./validator/playlists');

// collaborations
const collaborations = require('./api/collaborations'); // collaborations PLUGIN
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// exports
const _exports = require('./api/exports'); // exports playlist plugin
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// upload
const uploads = require('./api/uploads'); // upload plugin
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

const init = async () => {
  // init Service
  const userService = new UserService();
  const collaborationsService = new CollaborationsService(userService);
  const songService = new SongService();
  const playlistsService = new PlaylistsService(songService, collaborationsService);
  const albumService = new AlbumService();
  const authenticationService = new AuthenticationsService();

  // static path is defined here
  const storageService = new StorageService(path.resolve(__dirname, 'resources/images'));

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
    {
      plugin: Inert,
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
    {
      plugin: _exports,
      options: {
        service: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
    {
      plugin: uploads,
      options: {
        service: storageService,
        validator: UploadsValidator,
        albumService,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // destructure request object, taking response
    const { response } = request;

    // catch ALL ERROR in response
    if (response instanceof Error) {
      // catch ClientError
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      // skip error, keep respond continue if it threw by server side.
      if (!response.isServer) {
        return h.continue;
      }
      // catch error if something wrong with app
      console.log(response);
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // if response not an error
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
