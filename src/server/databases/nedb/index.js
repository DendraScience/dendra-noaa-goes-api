module.exports = (function () {
  return function () {
    const app = this
    const nedb = app.get('databases').nedb

    if (nedb.cache) app.configure(require('./cache'))
  }
})()
