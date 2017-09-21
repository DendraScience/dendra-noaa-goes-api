const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')

exports.before = {
  // all: [],

  find: [
    apiHooks.coerceQuery()
  ],

  // get: [],

  create: [
    hooks.disallow('rest'),
    apiHooks.timestamp()
  ],

  update: [
    hooks.disallow('rest'),
    apiHooks.timestamp()
  ],

  patch: hooks.disallow('rest'),
  remove: hooks.disallow('rest')
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
