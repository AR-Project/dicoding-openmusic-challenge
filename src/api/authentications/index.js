const AuthenticationHandler = require('./handler');
const routes = require('./routes');

// This is the 'head' of authentification plugin.
// hapi plugin 'always' had three files dependency:
// index.js : kinda receptionist
// routes.js : kinda bellboy
// handler.js : kinda kitchen

module.exports = {
  name: 'authentication',
  version: '1.0.0',
  register: async (server, {
    authenticationService, // parameter
    userService, // parameter
    tokenManager, // parameter
    validator, // parameter
  }) => {
    // this object will be passed to routes that being used by server.route().
    const authenticationHandler = new AuthenticationHandler(
      authenticationService, // passed by from server.js
      userService, // passed by from server.js
      tokenManager, // passed by from server.js
      validator, // passed by from server.js
    );

    server.route(routes(authenticationHandler)); // routes refer to top line require
  },
};
