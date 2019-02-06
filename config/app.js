'use strict';
/**
 * Global application settings
 * Environment variable settings:
 *
 * SQL_HOST - the SQL hostname
 * SQL_USER - the SQL username
 * SQL_PASSWORD - the SQL password to use
 * SQL_DATABASE - the SQL database to use
 * SETUP_ACCOUNT - the root account name (defaults to "root")
 * SETUP_ACCOUNT_PASSWORD - (optional - the password of the root account)
 * SETUP_PROJECT - the default project name (defaults to "default")
 * SETUP_API_KEY - the root API key to create (suggested min of 32-character random string)
 * */
module.exports = {
  'transport.http': {
    port: 8080,
    actionPath: ['/api'],
    options: {
      payloadLimit: 5000000
    }
  },
  'store.sql': {
    'host': '$ENV:SQL_HOST',
    'user': '$ENV:SQL_USER',
    'password': '$ENV:SQL_PASSWORD',
    'database': '$ENV:SQL_DATABASE',
    'dialectOptions': {},
    'clean': false,
    'debug': {
      'crudify': false,
      'setup': false
    }
  },
  'plugin.session': {
    'cookieName': 'dispenser',
    'store': 'sql',
    'namespace': 'session',
    'removeExpired': true
  },
  'settings': {
    'security': {
      'saltRounds': 10, // password salt rounds
      'passwordLength': 10  // min password length
    },
    'setup': {  // default settings
      'account': 'root',
      'project': 'default',
      'apiKeySize': 48
    }
  }
};
if (global.THORIN_SETUP) {
  module.exports['store.sql']['dialectOptions']['multipleStatements'] = true;
  module.exports['store.sql']['debug'] = false;
}
if (process.env.SQL_SSL_CA && process.env.SQL_SSL_CERT && process.env.SQL_SSL_KEY) {
  module.exports['store.sql']['dialectOptions']['ssl'] = {
    ca: process.env.SQL_SSL_CA,
    cert: process.env.SQL_SSL_CERT,
    key: process.env.SQL_SSL_KEY
  };
}
