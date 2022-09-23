// bridge between handler and table authentications table database

const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class AuthenticationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addRefreshToken(token) {
    // prep query: insert refreshToken into authentications
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    // run query, no need to store result
    await this._pool.query(query);
  }

  async verifyRefreshToken(token) {
    // prep query: check if refreshToken exist inside authentications table
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    // run query - fetch data into result
    const result = await this._pool.query(query);

    // using result: validate if query return something
    if (!result.rows.length) {
      throw new InvariantError('Refresh token tidak valid');
    }
  }

  async deleteRefreshToken(token) {
    // prep query: delete a row of authentications table using refreshToken
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    // run delete query using query variable
    await this._pool.query(query);
  }
}

module.exports = AuthenticationsService;
