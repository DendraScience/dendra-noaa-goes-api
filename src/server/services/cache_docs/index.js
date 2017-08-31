const service = require('feathers-nedb')
const hooks = require('./hooks')

module.exports = (function () {
  return function () {
    const app = this
    const databases = app.get('databases')

    if (databases.nedb && databases.nedb.cache) {
      app.set('serviceReady',
        Promise.resolve(databases.nedb.cache.db).then(db => {
          app.use('/cache/docs', service({
            Model: db.docs,
            paginate: databases.nedb.cache.paginate
          }))

          // Get the wrapped service object, bind hooks
          const docService = app.service('/cache/docs')

          docService.before(hooks.before)
          docService.after(hooks.after)
        }))
    }
  }
})()
