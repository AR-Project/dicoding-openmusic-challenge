const LikesHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'likes',
  version: '1.0.0',
  register: async (server, { service }) => {
    const likesHandler = new LikesHandler(service);
    server.route(routes(likesHandler));
  },
};
