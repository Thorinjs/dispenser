'use strict';
/**
 * The subscriber model contains information about the external systems that will receive a call
 * once an event was triggered by an internal application and the metadata from said event
 * matches a subset of subscribers
 * */

module.exports = (modelObj, Seq) => {

  modelObj
    .field('id', Seq.UUID_SHORT, {
      primaryKey: true
    })
    .field('name', Seq.STRING(200), {
      defaultValue: null
    })
    .field('type', Seq.STRING(30), {  // The subscriber type (HTTP/EMAIL(todo)/SMS(todo)/WS(todo))
      defaultValue: 'HTTP'
    })
    .field('url', Seq.TEXT, { // The subscriber target URL (URI for HTTP, email@ for EMAIL, phoneNumber for SMS)
      defaultValue: null
    })
    .field('data', Seq.TEXT, {  // Additional subscriber data, based on the subscriber type. This is a JSON.
      defaultValue: null
    })
    .field('config_max_retries', Seq.INTEGER, {
      defaultValue: 1
    })
    .field('config_timeout', Seq.INTEGER, {
      defaultValue: 10
    });

  modelObj
    .belongsTo('project');


  modelObj
    .setter('data', function (v) {
      if (typeof v !== 'object' || !v) return;
      try {
        let d = JSON.stringify(v);
        this.setDataValue('data', d);
      } catch (e) {
      }
    })
    .getter('data', function () {
      try {
        let v = JSON.parse(this.getDataValue('data'));
        return v;
      } catch (e) {
        return {};
      }
    });


};
