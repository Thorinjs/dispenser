'use strict';
/**
 * API Key CRUD functionality
 * */
const thorin = require('thorin'),
  dispatcher = thorin.dispatcher,
  store = thorin.store('sql'),
  logger = thorin.logger('apiKey');

/**
 * Creates a new API key for the specified project.
 * */
dispatcher
  .addAction('api.apiKey.create')
  .alias('POST', '/api/projects/:project_id/api-keys')
  .authorize('session')
  .use('data.project')
  .use(async (intentObj, next) => {
    const projectObj = intentObj.data('project'),
      apiKeyLib = thorin.lib('apiKey');
    try {
      let keyObj = await apiKeyLib.create(projectObj);
      logger.info(`Account: ${intentObj.session.account_id} created API Key: ${keyObj.id} for project: ${projectObj.id}`);
      intentObj.result(keyObj);
      next();
    } catch (e) {
      logger.warn(`Could not create API key for project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  });

/**
 * Reads an API Key based on its id.
 * */
store
  .crudify('apiKey', 'read', {
    action: 'api.apiKey.read'
  })
  .alias('GET', '/api/projects/:project_id/api-keys/:id')
  .authorize('session')
  .use('data.project')
  .filter('read.before', (intentObj, qry) => {
    qry.where.project_id = intentObj.input('project_id');
  });

/**
 * Finds all API keys for a specific project.
 * */
store
  .crudify('apiKey', 'find', {
    action: 'api.apiKey.find'
  })
  .alias('GET', '/api/projects/:project_id/api-keys')
  .authorize('session')
  .use('data.project')
  .filter('find.before', (intentObj, qry) => {
    qry.where.project_id = intentObj.input('project_id');
  });

/**
 * Deletes an API key
 * */
dispatcher
  .addAction('api.apiKey.delete')
  .alias('DELETE', '/api/projects/:project_id/api-keys/:id')
  .authorize('session')
  .use('data.project')
  .input({
    id: dispatcher.validate('STRING').error('DATA.INVALID', 'Please provide the API Key id')
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      projectObj = intentObj.data('project');
    try {
      const ApiKey = store.model('apiKey');
      let keyObj = await ApiKey.findOne({
        where: {
          id: input.id,
          project_id: projectObj.id
        }
      });
      if (!keyObj) return next(thorin.error('API_KEY.NOT_FOUND', 'The requested API Key does not exist', 404));
      await keyObj.destroy();
      logger.info(`Account: ${intentObj.session.account_id} deleted API Key: ${keyObj.id} for project: ${projectObj.id}`);
      next();
    } catch (e) {
      logger.warn(`Could not destroy API Key: ${input.id} for project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  })

