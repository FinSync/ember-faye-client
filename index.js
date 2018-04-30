/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-faye-client',

  included: function(app) {
    this._super.included.apply(this, arguments);

    app.import(app.bowerDirectory + '/faye-browser/faye-browser.js');
  }
};
