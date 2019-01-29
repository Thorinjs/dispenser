'use strict';
/**
 * Each subscriber has metadata associated to him,
 * so that when we trigger events, it is easy to select
 * subscribers to send out to.
 * Eg:
 * Subscriber1 with metadata: {app_id: 1,user_id: 2}
 * will give 2 metadata items: sha1(app_id:1) and sha1(user_id:2)
 * When an event with this metadata occurs, we will match all subscribers
 * that have the above metadata items.
 * */

module.exports = function (modelObj, Seq) {
  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('value', Seq.STRING(64), {
      defaultValue: null
    });

  modelObj
    .belongsTo('subscriber')
    .index('value');
};

