const redis = require('redis');
const config = require('../../utils/config');

class CacheService {
  constructor() {
    // create redis object/connection
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
      },
    });

    // set default behavior when error on _this client is detected
    this._client.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });

    // start the connection when CacheService is init from /server.js
    this._client.connect();
  }

  async set(key, value, expirationInSecond = 1800) {
    // note: expiration requirement 30 minutes = 1800 s
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    // fetch data from redis using key (note: its `likes:${albumId})
    const result = await this._client.get(key);

    // for the node app logic, need 'convert' null result into error, instead returning null.
    if (result === null) throw new Error('Cache tidak ditemukan');

    return result;
  }

  delete(key) {
    // paham?
    return this._client.del(key);
  }
}

module.exports = CacheService;
