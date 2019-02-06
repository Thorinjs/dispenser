'use strict';
/**
 * Middleware for pre-populating data
 * */
const thorin = require('thorin'),
  dispatcher = thorin.dispatcher,
  store = thorin.store('sql'),
  logger = thorin.logger('data');

/**
 * Middleware-template for project-releated resources.
 * Note: this middleware works with 'session' authorisation.
 * */
dispatcher
  .addMiddleware('data.project')
  .input({
    project_id: dispatcher.validate('STRING', {length: 32}).error('DATA.INVALID', 'Please provide a valid project id')
  })
  .use(async (intentObj, next, opt) => {
    const input = intentObj.input(),
      accountId = intentObj.session.account_id || null;
    try {
      let projectObj;
      const Project = store.model('project'),
        ProjectAccount = store.model('projectAccount');
      if (accountId) {
        let pObj = await ProjectAccount.findOne({
          where: {
            project_id: input.project_id,
            account_id: accountId
          },
          include: [{
            model: Project,
            as: 'project',
            required: true
          }]
        });
        if (!pObj) return next(thorin.error('PROJECT.NOT_FOUND', 'The requested project does not exist', 404));
        projectObj = pObj.get('project');
        if (opt.role && pObj.role !== opt.role) {
          return next(thorin.error('PROJECT.AUTH', 'You cannot perform this action on this project', 401));
        }
        projectObj.role = pObj.role;
      } else {
        projectObj = await Project.findOne({
          where: {
            id: input.project_id
          }
        });
        return next(thorin.error('PROJECT.NOT_FOUND', 'The requested project does not exist', 404));
      }
      intentObj.data('project', projectObj);
      next();
    } catch (e) {
      logger.warn(`Could not read project ${input.project_id} for: ${intentObj.action}`);
      logger.debug(e);
      return next(e);
    }
  });


