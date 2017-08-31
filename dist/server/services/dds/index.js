'use strict';

const hooks = require('./hooks');
const moment = require('moment');
const { errors } = require('feathers-errors');
const { sharedPool } = require('../../lib/dds-pool');
const { treeMap } = require('@dendra-science/utils');
const { types } = require('@dendra-science/goes-dds-client');

const DATE_FORMAT = 'YYYY/DDD HH:mm:ss';

function checkResponseData(data) {
  const d = data[0];
  if (d && d.serverCode) throw new errors.BadRequest(d.explanation, d);
}

/**
 * Low-level services to send and process NOAA/DDS requests.
 *
 * This is a custom service since we need to hit a 3rd party data service.
 */
class Service {
  constructor(options) {
    this.pool = options.pool;
  }

  setup(app) {
    this.app = app;
  }

  find(params) {
    const criteriaOpts = treeMap(params.query, obj => {
      // Only map values that were coerced, i.e. in the correct format
      if (obj instanceof Date) return moment(obj).utc().format(DATE_FORMAT);
      return obj;
    });

    return this.pool.execute(({ client }) => {
      return client.request(types.IdCriteria, criteriaOpts).then(res => {
        return res.data();
      }).then(data => {
        checkResponseData(data);
        return client.request(types.IdDcpBlockExt);
      }).then(res => {
        return res.data();
      }).then(data => {
        checkResponseData(data);
        return {
          criteria_options: criteriaOpts,
          response_data: data
        };
      });
    });
  }
}

module.exports = function () {
  return function () {
    const app = this;
    const services = app.get('services');

    if (services.dds) {
      const pool = sharedPool(Object.assign({
        numSlots: 1
      }, services.dds, {
        logger: app.logger
      }));

      app.use('/dds/dcp-block-ext', new Service({
        messageTypes: [types.IdCriteria, types.IdDcpBlockExt],
        pool: pool
      }));

      // Get the wrapped service object, bind hooks
      const dcpBlockExtService = app.service('/dds/dcp-block-ext');

      dcpBlockExtService.before(hooks.before);
      dcpBlockExtService.before(hooks.dcpBefore);
      dcpBlockExtService.after(hooks.after);
    }
  };
}();