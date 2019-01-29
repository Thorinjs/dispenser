'use strict';
/**
 * This is our API Key verification library
 * */
const thorin = require('thorin'),
  store = thorin.store('sql'),
  logger = thorin.logger('apiKey');

const API_KEY_LENGTH = thorin.config('settings.setup.apiKeySize');

class ApiKey {

  /**
   * Creates a new API Key, given a project object and some API key data.
   * @Arguments
   *    projectObj - an instance of a project
   *    data.token - (optional) the raw API Key token string
   *    data.transaction - (optional) the transaction to use.
   * */
  async create(projectObj, data = {}) {
    try {
      const ApiKey = store.model('apiKey');
      if (!data.token) data.token = thorin.util.randomString(API_KEY_LENGTH);
      let keyObj = ApiKey.build({
        token_hash: thorin.util.sha2(data.token),
        token_public: data.token.substr(0, 4),
        project_id: projectObj.id
      });
      await keyObj.save({
        transaction: data.transaction
      });
      keyObj.token = data.token;
      return keyObj;
    } catch (e) {
      logger.warn(`Could not create an API Key for project: ${projectObj.id}`);
      logger.debug(e);
      throw thorin.error('API_KEY.ERROR', 'An error occurred while creating the API Key', e);
    }
  }

  /**
   * Given an API Key in its raw form, it will return the keyObj
   * associated, or false if it failed.
   * @Arguments
   *  token - the raw API Key string
   * */
  async verify(token) {
    if (typeof token !== 'string' || !token) return false;
    if (token.indexOf('Bearer ') === 0) token = token.substr(7);
    try {
      const ApiKey = store.model('apiKey');
      let hash = thorin.util.sha2(token);
      let keyObj = await ApiKey.findOne({
        where: {
          token_hash: hash
        },
        limit: 1,
        attributes: ['id', 'token_public', 'created_at', 'project_id'],
        logging: false
      });
      if (!keyObj) return false;
      return keyObj;
    } catch (e) {
      logger.warn(`Could not verify API Key`);
      logger.debug(e);
      return false;
    }
  }

}

thorin.addLibrary(ApiKey, 'apiKey');
