const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
// const {errors} = require('feathers-errors')

exports.before = {
  // all: [],

  find: [
    apiHooks.splitList('params.query.decode_columns'),
    apiHooks.splitList('params.query.decode_slice'),
    apiHooks.coerceQuery(),

    (hook) => {
      /*
        Timeseries services must:
        * Support a 'compact' query field
        * Support a 'time[]' query field with operators $gt, $gte, $lt and $lte
        * Support a '$sort[time]' query field
        * Accept and return time values in simplified extended ISO format (ISO 8601)
       */

      const query = hook.params.query

      if (query.compact) query.body_encoding = 'hex'

      hook.params.compact = query.compact
    },

    hooks.removeQuery('compact')
  ],

  get: hooks.disallow(),
  create: hooks.disallow(),
  update: hooks.disallow(),
  patch: hooks.disallow(),
  remove: hooks.disallow()
}

exports.after = {
  // all: [],

  find (hook) {
    if (!hook.params.compact) return

    // Reformat results asynchronously; 20 items at a time (hardcoded)
    // TODO: Move hardcoded 'count' to config
    // TODO: Move this into a global hook?
    const count = 20
    const data = hook.result.data
    const mapTask = function (start) {
      return new Promise((resolve) => {
        setImmediate(() => {
          const len = Math.min(start + count, data.length)
          for (let i = start; i < len; i++) {
            const item = data[i]
            const newItem = {}

            const message = item.message
            if (message) {
              // Compact data object - the message
              newItem.d = message

              // Compact time value
              const header = message.header
              if (header && header.timeDate) {
                newItem.t = header.timeDate
              }
            }

            const decoded = item.decoded
            if (Array.isArray(decoded)) {
              // Compact data array - the decoded message
              newItem.da = decoded
            }

            data[i] = newItem
          }
          resolve()
        })
      })
    }
    const tasks = []
    for (let i = 0; i < data.length; i += count) {
      tasks.push(mapTask(i))
    }
    return Promise.all(tasks).then(() => {
      return hook
    })
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
