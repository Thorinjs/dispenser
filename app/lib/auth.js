'use strict';
/**
 * The class is used for user authentication/password handling
 * */
const thorin = require('thorin'),
  bcrypt = require('bcrypt'),
  logger = thorin.logger('auth'),
  store = thorin.store('sql');
const SALT_ROUNDS = thorin.config('settings.security.saltRounds') || 10,
  PASSWORD_LENGTH = thorin.config('settings.security.passwordLength');

class Auth {

  /**
   * Given a username and password, it will try to
   * authenticate a user and return an accountObj.
   * @Arguments
   *  data.username - the username
   *  data.password - the password
   * */
  async authenticate(data = {}) {
    if (!data || typeof data.username !== 'string' || !data.username) return null;
    if (typeof data.password !== 'string' || !data.password) return null;
    try {
      const Account = store.model('account');
      let accObj = await Account.findOne({
        where: {
          username: data.username
        }
      });
      if (!accObj) {
        // hash the password nevertheless, to avoid timing attacks.
        await this.hashPassword(data.password);
        return null;
      }
      if (accObj.password === null) {
        throw thorin.error('AUTH.PASSWORD', 'Please setup a new password');
      }
      let isOk = await this.comparePasswords(data.password, accObj.password);
      if (!isOk) return null;
      return accObj;
    } catch (e) {
      if (e.ns === 'AUTH') throw e;
      logger.warn(`Could not perform account authentication for: ${data.username}`);
      logger.debug(e);
      return null;
    }
  }

  /**
   * Setup the initial password of the root account.
   * @Arguments
   *  data.username - the username
   *  data.password - the new password
   *  data.password_repeat - the new password again.
   * */
  async passwordSetup(data = {}) {
    if (typeof data !== 'object' || !data || typeof data.username !== 'string' || !data.username) return false;
    if (typeof data.password !== 'string' || !data.password) return false;
    try {
      const Account = store.model('account');
      let accObj = await Account.findOne({
        where: {
          username: data.username
        }
      });
      if (!accObj || accObj.password !== null) {
        await this.hashPassword(data.password);
        return false;
      }
      if (data.password !== data.password_repeat) throw thorin.error('AUTH.PASSWORD', 'The provided passwords do not match');
      if (data.password.length < PASSWORD_LENGTH) throw thorin.error('AUTH.PASSWORD', 'Password is too short.');
      let hashed = await this.hashPassword(data.password);
      accObj.set('password', hashed);
      await accObj.save({
        logging: false
      });
      return true;
    } catch (e) {
      if (e.ns === 'AUTH') throw e;
      logger.warn(`Could not setup password for: ${data.username}`);
      logger.debug(e);
      return false;
    }
  }

  /**
   * Hashes the given string
   * @Arguments
   *  password - the password to hash
   * */
  hashPassword(password) {
    let salt, hash;
    try {
      salt = bcrypt.genSaltSync(SALT_ROUNDS)
    } catch (e) {
      logger.warn(`Could not generate salt`);
      logger.debug(e);
      throw thorin.error('AUTH.HASH', 'An error occurred while hashing password', e);
    }
    try {
      hash = bcrypt.hashSync(password, salt);
      return hash;
    } catch (e) {
      logger.warn(`Could not hash password`);
      logger.debug(e);
      thorin.error('AUTH.HASH', 'An error occurred while hashing password', e);
    }
  }

  /**
   * Compares a plaintext password with a hashed password, returning a promise.
   * @Arguments
   *  plaintextPassword - the plain text password
   *  hashedPassword - the hashed password
   * */
  comparePasswords(plaintextPassword, hashedPassword) {
    try {
      let ok = bcrypt.compareSync(plaintextPassword, hashedPassword);
      return ok === true;
    } catch (e) {
      logger.warn(`Could not compare hashed passwords`);
      logger.debug(e);
      return false;
    }
  }

}

thorin.addLibrary(Auth, 'auth');
