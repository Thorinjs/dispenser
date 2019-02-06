'use strict';
/**
 * Handles user authentication
 * */
const thorin = require('thorin'),
  bcrypt = require('bcrypt'),
  logger = thorin.logger('auth'),
  dispatcher = thorin.dispatcher,
  store = thorin.store('sql');

/**
 * Performs user authentication and initiates a new session.
 * */
dispatcher
  .addAction('api.auth.login')
  .alias('POST', '/api/auth/login')
  .input({
    username: dispatcher.validate('STRING', {max: 100}).error('DATA.INVALID', 'Please enter your username'),
    password: dispatcher.validate('STRING').error('DATA.INVALID', 'Please enter your password')
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      session = intentObj.session,
      authLib = thorin.lib('auth');
    if (session.account_id) return next(thorin.error('DATA.INVALID', 'You are already logged in'));
    try {
      let accObj = await authLib.authenticate(input);
      session.account_id = accObj.id;
      intentObj.result(accObj);
      next();
    } catch (e) {
      if (e.ns !== 'AUTH') {
        logger.warn(`Could not authenticate user: ${input.username}`);
        logger.debug(e);
      }
      return next(e);
    }
  });

/**
 * Setup the password of a newly created dispenser application. This
 * is done once, on the root user created.
 * */
dispatcher
  .addAction('api.auth.setup')
  .alias('POST', '/api/auth/setup')
  .input({
    username: dispatcher.validate('STRING').error('DATA.INVALID', 'Please enter your username'),
    password: dispatcher.validate('STRING').error('DATA.INVALID', 'Please enter your password'),
    password_repeat: dispatcher.validate('STRING').error('DATA.INVALID', 'Please enter your password again'),
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      session = intentObj.session,
      authLib = thorin.lib('auth');
    if (session.account_id) return next(thorin.error('DATA.INVALID', 'You are already logged in'));
    try {
      let accObj = await authLib.passwordSetup(input);
      if (!accObj) {
        return next(thorin.error('DATA.INVALID', 'The requested information is no longer available'));
      }
      session.account_id = accObj.id;
      intentObj.result(accObj);
      next();
    } catch (e) {
      if (e.ns !== 'AUTH') {
        logger.warn(`Could not authenticate user: ${input.username}`);
        logger.debug(e);
      }
      return next(e);
    }
  });

/**
 * Terminates the user's session
 * */
dispatcher
  .addAction('api.auth.logout')
  .alias('POST', '/api/auth/logout')
  .use((intentObj, next) => {
    if (intentObj.session.account_id) {
      intentObj.session.destroy();
    }
    next();
  });

/**
 * A logged in account has the possibility to create other accounts.
 * */
dispatcher
  .addAction('api.auth.register')
  .alias('POST', '/api/auth/register')
  .authorize('session')
  .input({
    username: dispatcher.validate('STRING', {max: 100}).error('DATA.INVALID', 'Please provide the username')
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input();
    const Account = store.model('account');
    try {
      let accountObj = await Account.findOne({
        where: {
          id: intentObj.session.account_id,
          created_by_id: null
        }
      });
      if (!accountObj) {
        logger.warn(`Account: ${intentObj.session.account_id} tried to create account and he is not the owner`);
        return next(thorin.error('DATA.INVALID', 'Only the dispenser owner is able to create new accounts.'));
      }
      let exists = await Account.findOne({
        where: {
          username: input.username
        }
      });
      if (exists) return next(thorin.error('DATA.INVALID', 'An account with this username already exists.', {field: 'username'}));
      let accObj = Account.build({
        username: input.username,
        created_by_id: accountObj.id
      });
      await accObj.save();
      logger.info(`Account: ${accountObj.id} created new account: ${accObj.id} [${accObj.username}]`);
      next();
    } catch (e) {
      logger.warn(`Account: ${intentObj.session.account_id} could not register: ${input.username}`);
      logger.debug(e);
      return next(e);
    }
  });
