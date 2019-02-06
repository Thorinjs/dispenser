'use strict';
/**
 * An API Key contains information about the system that triggers an event
 * to be sent out to its subscribers.
 * API keys are visible only once.
 * */

module.exports = (modelObj, Seq) => {

  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('token_hash', Seq.STRING(128))
    .field('token_public', Seq.STRING(10), {
      defaultValue: null
    });

  modelObj
    .index('token_hash')
    .belongsTo('project')
    .belongsTo('account', {
      as: 'createdBy',
      foreignKey: 'created_by_id'
    })
    .json(function () {
      let d = {
        id: this.id,
        project_id: this.project_id,
        created_at: this.created_at
      };
      if (this.token) {
        d.token = this.token;
      } else if (this.token_public) {
        d.token_public = this.token_public;
      }
      return d;
    });

};
