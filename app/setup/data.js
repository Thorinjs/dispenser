'use strict';
const thorin = require('thorin');
/**
 * This will auto-populate the database with default data from
 * the environment variables.
 * */
module.exports = async (config) => {
  const store = thorin.store('sql');

  await store.transaction(async (t) => {
    // Handle: SETUP_ACCOUNT and SETUP_ACCOUNT_PASSWORD
    let accountName = process.env.SETUP_ACCOUNT || thorin.config('settings.setup.account');
    const Account = store.model('account'),
      Project = store.model('project');

    let accObj = await Account.findOne({
      where: {
        username: accountName
      },
      transaction: t
    });
    if (!accObj) {
      log.info(`Creating root account: ${accountName}`);
      accObj = Account.build({
        username: accountName
      });
      await accObj.save({
        transaction: t
      });
    }
    config.account = accObj;

    // Handle: SETUP_PROJECT
    let projectName = process.env.SETUP_PROJECT || thorin.config('settings.setup.project');
    let projectObj = await Project.findOne({
      where: {
        name: projectName
      },
      transaction: t
    });
    if (!projectObj) {
      log.info(`Creating root project: ${projectName}`);
      projectObj = Project.build({
        name: projectName
      });
      await projectObj.save({
        transaction: t
      });
    }
    config.project = projectObj;

    if (config.project && config.account) {
      const ProjectAccount = store.model('projectAccount');
      let tObj = await ProjectAccount.findOne({
        where: {
          project_id: config.project.id,
          account_id: config.account.id
        }
      });
      if (!tObj) {
        log.info(`Granting account: ${config.account.username} access to: ${config.project.name}`);
        tObj = ProjectAccount.build({
          project_id: config.project.id,
          account_id: config.account.id
        });
      }
      tObj.set('role', 'OWNER');
      await tObj.save({
        transaction: t
      });
    }

    // Handle: SETUP_API_KEY
    if (process.env.SETUP_API_KEY) {
      const ApiKey = store.model('apiKey');
      let keyObj = await ApiKey.findOne({
        where: {
          token_hash: thorin.util.sha2(process.env.SETUP_API_KEY)
        },
        transaction: t
      });
      if (!keyObj) {
        log.info(`Creating root API Key`);
        const apiKeyLib = thorin.lib('apiKey');
        keyObj = await apiKeyLib.create(config.project, {
          token: process.env.SETUP_API_KEY,
          transaction: t
        });
      }
      config.apiKey = keyObj;
    }
  });
};
