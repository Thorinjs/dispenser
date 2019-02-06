'use strict';
/**
 * These are the Project-model CRUD
 * */
const thorin = require('thorin'),
  dispatcher = thorin.dispatcher,
  store = thorin.store('sql'),
  logger = thorin.logger('project');

/**
 * Creates a new project
 * */
dispatcher
  .addAction('api.project.create')
  .alias('POST', '/api/projects')
  .input({
    name: dispatcher.validate('STRING', {max: 100}).error('DATA.INVALID', 'Please provide the project name')
  })
  .authorize('session')
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      accountId = intentObj.session.account_id,
      Project = store.model('project'),
      ProjectAccount = store.model('projectAccount');
    try {
      await store.transaction(async (t) => {
        let projectObj = Project.build({
          name: input.name
        });
        await projectObj.save({
          transaction: t
        });
        let pAcc = ProjectAccount.build({
          project_id: projectObj.id,
          account_id: accountId,
          role: 'OWNER'
        });
        await pAcc.save({
          transaction: t
        });
        logger.info(`Project: ${projectObj.id} [${projectObj.name}] created by ${accountId}`);
        intentObj.result(projectObj);
      });
      next();
    } catch (e) {
      if (e.ns !== 'DATA') {
        logger.warn(`Could not create project: [${input.name}]`);
        logger.debug(e);
      }
      return next(e);
    }
  });

/**
 * Reads a project
 * */
dispatcher
  .addAction('api.project.read')
  .alias('GET', '/api/projects/:project_id')
  .authorize('session')
  .use('data.project')
  .use(async (intentObj, next) => {
    const projectObj = intentObj.data('project');
    // Read all users that have access to the project.
    try {
      const ProjectAccount = store.model('projectAccount'),
        Account = store.model('account');
      let accounts = await ProjectAccount.findAll({
        where: {
          project_id: projectObj.id
        },
        attributes: ['role'],
        order: [['role', 'ASC']],
        include: {
          model: Account,
          as: 'account',
          required: true,
          order: [['username', 'ASC']],
          attributes: ['id', 'username']
        }
      });
      projectObj.accounts = accounts.map((acc) => {
        let item = acc.get('account').toJSON();
        item.role = acc.role;
        return item;
      });
      intentObj.result(projectObj);
      next();
    } catch (e) {
      logger.warn(`Could not read accounts of project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  });

/**
 * Updates information about a project.
 * */
dispatcher
  .addAction('api.project.update')
  .alias('PUT', '/api/projects/:project_id')
  .authorize('session')
  .use('data.project')
  .input({
    name: dispatcher.validate('STRING', {max: 100}).default(null)
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      projectObj = intentObj.data('project');
    if (projectObj.role !== 'OWNER') return next(thorin.error('PROJECT.AUTH', 'This role cannot perform this action.'))
    if (input.name) projectObj.set('name', input.name);
    try {
      logger.info(`Project: ${projectObj.id} updated by: ${intentObj.session.account_id}`);
      await projectObj.save();
      next();
    } catch (e) {
      logger.warn(`Could not update project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  });

/**
 * Deletes a project based on its id
 * */
dispatcher
  .addAction('api.project.delete')
  .alias('DELETE', '/api/projects/:project_id')
  .authorize('session')
  .use('data.project')
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      projectObj = intentObj.data('project');
    if (projectObj.role !== 'OWNER') return next(thorin.error('PROJECT.AUTH', 'This role cannot perform this action.'))
    try {
      await projectObj.destroy();
      logger.info(`Project: ${projectObj.id} [${projectObj.name}] deleted by: ${intentObj.session.account_id}`);
      next();
    } catch (e) {
      logger.warn(`Could not destroy project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  });

/**
 * Finds all the project a user has access to.
 * */
store
  .crudify('projectAccount', 'find', {
    action: 'api.project.find'
  })
  .alias('GET', '/api/projects')
  .authorize('session')
  .filter('find.before', (intentObj, qry) => {
    qry.where.account_id = intentObj.session.account_id;
    qry.attributes = ['role'];
    qry.include = [{
      model: store.model('project'),
      as: 'project',
      required: true
    }]
  })
  .filter('find.send', (intentObj) => {
    let result = intentObj.result();
    result = result.map((p) => {
      let role = p.role,
        project = p.get('project');
      project.role = role;
      return project;
    });
    intentObj.result(result).send();
  });

/**
 * Grants access to an account, on a project.
 * This can only be done by accounts with OWNER role
 * */
dispatcher
  .addAction('api.project.access.create')
  .alias('POST', '/api/projects/:project_id/access')
  .authorize('session')
  .use('data.project', {
    role: 'OWNER'
  })
  .input({
    username: dispatcher.validate('STRING', {max: 100}).error('DATA.INVALID', 'Please provide the username'),
    role: dispatcher.validate('ENUM', ['OWNER', 'ADMIN']).default('ADMIN')
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      projectObj = intentObj.data('project');
    try {
      const Account = store.model('account'),
        ProjectAccount = store.model('projectAccount');
      const targetAccountObj = await Account.findOne({
        where: {
          username: input.username
        },
        attributes: ['id', 'username']
      });
      if (!targetAccountObj) return next(thorin.error('DATA.ACCOUNT', 'The requested account does not exist', 404));
      let exists = await ProjectAccount.findOne({
        where: {
          project_id: projectObj.id,
          account_id: targetAccountObj.id
        }
      });
      if (exists) return next(thorin.error('DATA.ACCOUNT', 'This account already has access to the project'));
      let c = ProjectAccount.build({
        account_id: targetAccountObj.id,
        project_id: projectObj.id,
        role: input.role
      });
      await c.save();
      logger.info(`Granted access to: ${input.username} on project: ${projectObj.id} [${input.role}]`);
      next();
    } catch (e) {
      logger.warn(`Could not grant access to: ${input.username} on project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  })

/**
 * Revokes access of an account for a project.
 * This can only be done by accounts with OWNER role
 * */
dispatcher
  .addAction('api.project.access.revoke')
  .alias('DELETE', '/api/projects/:project_id/access')
  .authorize('session')
  .use('data.project', {
    role: 'OWNER'
  })
  .input({
    username: dispatcher.validate('STRING', {max: 100}).error('DATA.INVALID', 'Please provide the username')
  })
  .use(async (intentObj, next) => {
    const input = intentObj.input(),
      projectObj = intentObj.data('project'),
      ProjectAccount = store.model('projectAccount'),
      Account = store.model('account');
    try {
      let pObj = await ProjectAccount.findOne({
        where: {
          project_id: projectObj.id
        },
        attributes: ['id', 'role'],
        include: {
          model: Account,
          as: 'account',
          required: true,
          attributes: ['id', 'username'],
          where: {
            username: input.username
          }
        }
      });
      if (!pObj) return next(thorin.error('PROJECT.AUTH', 'The provided username does not have access to this project', 404));
      await pObj.destroy();
      logger.info(`Account ${intentObj.session.account_id} revoked access on project: ${projectObj.id} for user: ${input.username}`);
      next();
    } catch (e) {
      logger.warn(`Could not revoke user: ${input.username} from project: ${projectObj.id}`);
      logger.debug(e);
      return next(e);
    }
  });
