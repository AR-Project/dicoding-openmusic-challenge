// bridge between handler and table authentications table database

const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class AuthenticationsService {
  constructor() {
    this._pool = new Pool();
  }

  // add refreshed token into authentications tables
  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await this._pool.query(query);
  }

  async verifyRefreshToken(token) {
    // prep query for  refresh token that stored in db using input token
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    // fetch query
    const result = await this._pool.query(query);

    // check if result bring back any token
    if (!result.rows.length) {
      throw new InvariantError('Refresh token tidak valid');
    }
  }

  async deleteRefreshToken(token) {
    // prep query
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    // run delete query using query variable
    await this._pool.query(query);
  }
}

module.exports = AuthenticationsService;
