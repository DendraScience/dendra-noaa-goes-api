const moment = require('moment')
const {configTimerSeconds} = require('../../lib/utils')

module.exports = (function () {
  return function () {
    const app = this
    const tasks = app.get('tasks')

    if (tasks.cache_grooming) {
      /*
        Get config settings; assume reasonable defaults.
       */

      const config = tasks.cache_grooming

      let docLimit = 20
      if (typeof config.docLimit === 'number') docLimit = config.docLimit

      let retentionMinutes = 60
      if (typeof config.retentionMinutes === 'number') retentionMinutes = config.retentionMinutes

      const handleError = function (err) {
        app.logger.error(err)
      }

      const scheduleTask = function () {
        const timerSeconds = configTimerSeconds(config)

        app.logger.info(`Task [cache_grooming]: Starting in ${timerSeconds} seconds`)

        setTimeout(() => {
          app.logger.info('Task [cache_grooming]: Running...')

          const docService = app.service('/cache/docs')
          const docQuery = {
            $or: [
              {updated_at: {$exists: false}},
              {updated_at: {$lt: moment().utc().subtract(retentionMinutes, 'm').toISOString()}}
            ],
            $limit: docLimit,
            $sort: {
              updated_at: -1
            }
          }

          docService.find({query: docQuery}).then(res => {
            if (res && res.data && res.data.length > 0) {
              return Promise.all(res.data.map(doc => {
                app.logger.info(`Task [cache_grooming]: Removing cache doc ${doc._id}`)
                return docService.remove(doc._id)
              }))
            }
            app.logger.info('Task [cache_grooming]: No cache docs found')
          }).catch(handleError).then((ret) => {
            if (!ret) return

            // Compact database if docs were removed
            const databases = app.get('databases')
            if (databases.nedb && databases.nedb.cache) {
              return Promise.resolve(databases.nedb.cache.db).then(db => {
                app.logger.info('Task [cache_grooming]: Queuing cache docs compaction')
                db.docs.persistence.compactDatafile()
              })
            }
          }).catch(handleError).then(scheduleTask)
        }, timerSeconds * 1000)
      }

      app.set('taskReady',
        Promise.resolve(app.get('middlewareReady')).then(scheduleTask))
    }
  }
})()
