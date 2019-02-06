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

  modelObj
    .json(function () {
      let d = {
        id: this.id,
        name: this.name,
        created_at: this.created_at
      };
      if (this.accounts) d.accounts = this.accounts;
      if (this.role) d.role = this.role;
      return d;
    });

};
