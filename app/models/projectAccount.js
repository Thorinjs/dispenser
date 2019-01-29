'use strict';
/**
 * The project account knows which account has access to what project.
 * */

module.exports = (modelObj, Seq) => {

  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('role', Seq.ENUM(['OWNER', 'ADMIN']), {
      defaultValue: 'OWNER'
    });
  modelObj
    .belongsTo('account')
    .belongsTo('project');

};
