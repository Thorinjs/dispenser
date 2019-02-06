'use strict';
/**
 * Middleware for session verification
 * */
const thorin = require('thorin'),
  dispatcher = thorin.dispatcher,
  store = thorin.store('sql');

const AUTH_ERROR = thorin.error('AUTH.ERROR', 'You must be logged in to perform this action', 401);

/**
 * Authorization for session-based verification.
 * */
dispatcher
  .addAuthorization('session')
  .use(async (intentObj, next) => {
    if (!intentObj.session || !intentObj.session.account_id) return next(AUTH_ERROR);
    next();
  });
