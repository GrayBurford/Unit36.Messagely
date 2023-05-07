
// User class for Messagely
const db = require("../db")
const bcrypt = require('bcrypt');
const ExpressError = require('../expressError');
const { BCRYPT_WORK_FACTOR } = require("../config");

// User of the site
class User {

  // Register new User, returns:
  // {username, password, first_name, last_name, phone}
  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(
      `INSERT INTO users 
        (username, password, first_name, last_name, phone, join_at, last_login_at) 
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp) 
        RETURNING username, password, first_name, last_name, phone`, 
        [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0];
  }


  // Authenticate: is this username/password valid? RETURNS A BOOLEAN
  static async authenticate(username, password) {
    const result = await db.query(`SELECT username, password FROM users WHERE username=$1`, [username]);

    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`Username ${username} not found`, 404);
    }

    return await bcrypt.compare(password, user.password);
  }


  // Updates last_login_at for a user
  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username=$1 RETURNING username`, [username]);

    const user = result.rows[0];
    if (!user) {
      throw new ExpressError(`That username doesn't exist: ${username}`, 404);
    }
    console.log(`User ${username} updated their login time.`)
  }


  // All: basic info on ALL USERS:
  // [{username, first_name, last_name, phone}, ...]
  static async all() {
    const result = await db.query(`SELECT username, first_name, last_name, phone FROM users ORDER BY username`);

    if (result.rows.length === 0) {
      throw new ExpressError("No users found!", 200);
    }

    return result.rows;
  }


  // GET: get a user by username
  // returns {username, first_name, last-name, phone, join_at, last_login_at}
  static async get(username) {
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1`, [username])

    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`This username was not found: ${username}`, 404);
    }

    return user;
  }


  // Return messages FROM this user
  // [{id, to_user, body, sent_at, read_at}, ... ]
  // where to_user is {username, first_name, last_name, phone}
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT messages.id,
        messages.to_username,
        messages.body,
        messages.sent_at,
        messages.read_at,
        users.first_name,
        users.last_name,
        users.phone
        FROM messages JOIN users
        ON messages.to_username=users.username
        WHERE from_username=$1`,
        [username]);

    return result.rows.map(msg => ({
      id : msg.id,
      to_user : {
        username : msg.to_username,
        first_name : msg.first_name,
        last_name : msg.last_name,
        phone : msg.phone
      },
      body : msg.body,
      sent_at : msg.sent_at,
      read_at : msg.read_at
    }));
  }


  // Return messages TO this user
  // [{id, from_user, body, sent_at, read_at}, ... ]
  // where from_user is {username, first_name, last_name, phone}
  static async messagesTo(username) {
    const result = await db.query(
      `SELECT messages.id,
        messages.body,
        messages.sent_at,
        messages.read_at,
        users.username,
        users.first_name,
        users.last_name,
        users.phone
        FROM messages JOIN users
        ON messages.from_username = users.username
        WHERE to_username=$1`,
        [username]);

    return result.rows.map(msg => ({
      id : msg.id,
      from_user : {
        username : msg.username,
        first_name : msg.first_name,
        last_name : msg.last_name,
        phone : msg.phone
      },
      body : msg.body,
      sent_at : msg.sent_at,
      read_at : msg.read_at
    }))
  }
}


module.exports = User;