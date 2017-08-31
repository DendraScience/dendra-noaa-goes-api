'use strict';

const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');

module.exports = function () {
  return function () {
    const app = this;
    const cache = app.get('databases').nedb.cache;
    const cachePath = path.resolve(cache.path);

    // Configure a new instance
    cache.db = new Promise((resolve, reject) => {
      fs.mkdir(cachePath, err => err && err.code !== 'EEXIST' ? reject(err) : resolve());
    }).then(() => {
      return {
        docs: new Datastore({
          filename: path.join(cachePath, 'docs.db'),
          autoload: true
        })
      };
    });
  };
}();