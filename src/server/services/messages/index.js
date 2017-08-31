const feathersQueryFilters = require('feathers-query-filters')
const hooks = require('./hooks')
const pb = require('@dendra-science/goes-pseudo-binary')

function dateSortPredicateAsc (a, b) {
  return a.message.header.timeDate.getTime() - b.message.header.timeDate.getTime()
}

function dateSortPredicateDesc (a, b) {
  return b.message.header.timeDate.getTime() - a.message.header.timeDate.getTime()
}

/**
 * High-level service to retrieve NOAA/DDS message data as JSON.
 *
 * This is a custom service since we need to hit a 3rd party data service.
 */
class Service {
  constructor (options) {
    this.paginate = options.paginate || {}
  }

  setup (app) {
    this.app = app
  }

  find (params) {
    /*
      Standard Feathers service preamble, adapted from feathers-sequelize.
     */

    const paginate = params && typeof params.paginate !== 'undefined' ? params.paginate : this.paginate
    const getFilter = feathersQueryFilters(params.query, paginate)
    const filters = getFilter.filters
    const query = getFilter.query

    // Body slice arguments applied before decoding; for pre-trimming the buffer
    const sliceArgs = Array.isArray(query.decode_slice) ? query.decode_slice.map(arg => arg | 0) : [0]

    // Prepare criteria for dcp service
    const dcpQuery = Object.assign({}, query)
    delete dcpQuery.body_encoding
    delete dcpQuery.decode_columns
    delete dcpQuery.decode_format
    delete dcpQuery.decode_slice

    let decoder
    if (typeof query.decode_format === 'string') decoder = new pb.Decoder(query.decode_format)

    const res = {
      limit: filters.$limit,
      data: []
    }

    return this.app.service(`/dds/dcp-block-ext`).find({query: dcpQuery}).then(dcpRes => {
      /*
        Prepare and return response.
       */

      let step = Promise.resolve()

      dcpRes.response_data.forEach(dcpData => {
        if (decoder) {
          // Prepare a pseudo binary decoding step
          step = step.then(() => decoder.decode(dcpData.message.body.slice(...sliceArgs)))

          // Prepare a map/reduce step if columns are specified
          if (Array.isArray(query.decode_columns)) {
            step = step.then(decodeRes => {
              if (decodeRes && decodeRes.rows) {
                return new Promise(resolve => {
                  setImmediate(() => {
                    decodeRes.rows = decodeRes.rows.map(row => {
                      return row.reduce((obj, cur, i) => {
                        const col = query.decode_columns[i]
                        obj[col || `c_${i + 1}`] = cur
                        return obj
                      }, {})
                    })
                    resolve(decodeRes)
                  })
                })
              }
            })
          }
        }

        step = step.then(decodeRes => {
          return new Promise(resolve => {
            setImmediate(() => {
              const item = {
                message: dcpData.message
              }

              if (decodeRes && decodeRes.rows) item.decoded = decodeRes.rows
              if (typeof query.body_encoding === 'string') item.message.body = item.message.body.toString(query.body_encoding)

              res.data.push(item)

              resolve()
            })
          })
        })
      })

      return step
    }).then(() => {
      // Clean up
      if (decoder) decoder.destroy()

      // Sort and trim
      if ((typeof filters.$sort === 'object') && (typeof filters.$sort.time !== 'undefined')) {
        res.data = filters.$sort.time === -1 ? res.data.sort(dateSortPredicateDesc) : res.data.sort(dateSortPredicateAsc)
      }
      if (res.data.length > filters.$limit) res.data.length = filters.$limit

      return res
    })
  }
}

module.exports = (function () {
  return function () {
    const app = this
    const services = app.get('services')

    if (services.message) {
      app.use('/messages', new Service({
        paginate: services.message.paginate
      }))

      // Get the wrapped service object, bind hooks
      const messageService = app.service('/messages')

      messageService.before(hooks.before)
      messageService.after(hooks.after)
    }
  }
})()
