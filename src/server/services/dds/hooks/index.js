const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')

exports.before = {
  // all: [],

  find: apiHooks.coerceQuery(),

  get: hooks.disallow(),
  create: hooks.disallow(),
  update: hooks.disallow(),
  patch: hooks.disallow(),
  remove: hooks.disallow()
}

exports.dcpBefore = {
  // all: [],

  find: [
    (hook) => {
      const query = hook.params.query

      // Eval 'time' query field
      if (typeof query.time === 'object') {
        const queryTime = query.time

        if (queryTime.$gt instanceof Date) {
          query.drs_since = (new Date(queryTime.$gt.getTime() + 1000))
        } else if (queryTime.$gte instanceof Date) {
          query.drs_since = queryTime.$gte
        }

        if (queryTime.$lt instanceof Date) {
          query.drs_until = (new Date(queryTime.$lt.getTime() - 1000))
        } else if (queryTime.$lte instanceof Date) {
          query.drs_until = queryTime.$lte
        }
      }
    },

    hooks.removeQuery('time')
  ]

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
