'use strict';
if (process.env.NODE_ENV === 'release') process.env.NODE_ENV = 'production';
global.THORIN_APP = 'dispenser';

const thorin = require('thorin');

thorin
  .addTransport(require('thorin-transport-http'))
  .addStore(require('thorin-store-sql'))
  .loadPath('app/lib');

thorin.run((err) => {
  if (err) {
    return thorin.exit(err);
  }
  log.info(`Dispenser server launcher`);
});
