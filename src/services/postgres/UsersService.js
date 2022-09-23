const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UserService {
  constructor() {
    this._pool = new Pool(); // postgres db, need env
  }

  async addUser({ username, password, fullname }) {
    // validate from username duplication
    await this.verifyNewUsername(username);

    // generate userId
    const id = `user-${nanoid(16)}`;

    // hashing the password - using bcrypt - store in variable hashedPassword
    const hashedPassword = await bcrypt.hash(password, 10);

    // prep query: add all info into users table
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };
    // run query - fetch result as object
    const result = await this._pool.query(query);

    // validate result
    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    // return only userId from result object
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    /**  preventing username duplication */

    // prep query: filter users table using current username
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    // run query - fetch data
    const result = await this._pool.query(query);

    // validate result
    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    /** not used by handler/routes, but still used in collaborationsService */

    // prep query: select user by id
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }

  // this service is used for check if username and password is valid in database
  async verifyUserCredential(username, password) {
    /** this method for login process */

    // prep query: get userId and password from users table using username
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };

    // run query - fetch result
    const result = await this._pool.query(query);

    // validate result: result -1 means username is not exist
    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    // destructure result rows object, gather id and password as hashedPassword
    const { id, password: hashedPassword } = result.rows[0];

    // with bcrypt: compare password, with hashedPassword
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }
    return id;
  }
}

module.exports = UserService;
