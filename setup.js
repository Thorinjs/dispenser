'use strict';
if (process.env.NODE_ENV === 'release') process.env.NODE_ENV = 'production';
global.THORIN_APP = 'dispenser';
global.THORIN_AUTOLOAD = false;
global.THORIN_SETUP = true;

process.argv.push(`--setup=store.sql`);
const thorin = require('thorin');


thorin
  .addStore(require('thorin-store-sql'))
  .addPlugin(require('thorin-plugin-session'))
  .loadPath('app/lib');

const setupData = require('./app/setup/data');

thorin.run(async (err) => {
  if (err) {
    return thorin.exit(err);
  }
  let configData = {};
  try {
    await setupData(configData);
  } catch (e) {
    log.error(`Setup data: failed`);
    return thorin.exit(e);
  }

  log.info('Dispenser setup completed');
  process.exit(0);
});
