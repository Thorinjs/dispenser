'use strict';
/**
 * The account model holds information about accounts in the dispenser system.
 * */

module.exports = (modelObj, Seq) => {

  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('username', Seq.STRING(120))
    .field('password', Seq.STRING(220), {
      defaultValue: null
    })

};
