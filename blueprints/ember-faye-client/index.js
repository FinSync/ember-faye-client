/* eslint-env node */
module.exports = {
  normalizeEntityName: function() {},
  description: 'Installs bower package for Faye',

  afterInstall: function() {
    return this.addBowerPackageToProject('faye-browser');
  }
};
