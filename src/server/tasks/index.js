const path = require('path')

module.exports = (function () {
  return function () {
    const app = this
    const taskNames = [
      'cache_grooming',
      'dds_grooming'
    ]

    // Feathers configuration is synchronous, so use promises to wait for
    // async stuff like database connections, etc.
    let ready = Promise.resolve()
    taskNames.forEach(name => {
      ready = ready.then(() => {
        app.set('taskReady', true)
        app.configure(require(path.join(__dirname, name)))

        // Each task configuration can optionally return a promise for
        // readiness via an app setting
        return app.get('taskReady')
      })
    })

    // All tasks are mounted when the last task promise is resolved
    app.set('tasksReady', ready)
  }
})()
