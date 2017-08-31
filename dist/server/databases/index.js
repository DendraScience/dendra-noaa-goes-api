'use strict';

module.exports = function () {
  return function () {
    const app = this;
    const databases = app.get('databases');

    if (databases.nedb) app.configure(require('./nedb'));
  };
}();