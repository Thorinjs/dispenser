'use strict';
/**
 * The project model holds information about a project.
 * You can have multiple projects defined
 * */

module.exports = (modelObj, Seq) => {

  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('name', Seq.STRING(120));

};
