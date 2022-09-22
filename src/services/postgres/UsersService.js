const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UserService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    // calling verifyNewUsername before registration
    // if current username exist error will thrown by verifyNewUsername function
    await this.verifyNewUsername(username);

    // init data
    const id = `user-${nanoid(16)}`;

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // prep query using all data includes hashed password
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };
    // fetch result
    const result = await this._pool.query(query);

    // insert validation
    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    // return id per requirement
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    // prep query, for check current username is already exist or not in DB
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    // fetch data using query
    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  // seems not used
  async getUserById(userId) {
    // old function
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
    // prep query for fetching id and hashed password from DB
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };

    // run query
    const result = await this._pool.query(query);

    // check if user exist using result length, -1 means no user in db
    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    // user valid, now extract hashed password from result
    const { id, password: hashedPassword } = result.rows[0];

    // using bcrypt compared function to compare betwen inputed password and
    // stored password. Compare function return either true or false
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    return id;
  }

  // seems not used
  async getUsersByUsername(username) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE username LIKE $1',
      values: [`%${username}%`],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = UserService;
