'use strict';

const feathersQueryFilters = require('feathers-query-filters');
const hooks = require('./hooks');
const Editor = require('../../lib/moment-editor').default;
const moment = require('moment');

function dateSortPredicateAsc(a, b) {
  return a.time.date.getTime() - b.time.date.getTime();
}

function dateSortPredicateDesc(a, b) {
  return b.time.date.getTime() - a.time.date.getTime();
}

/**
 * High-level service to retrieve NOAA/DDS message data as JSON.
 *
 * This is a custom service since we need to hit a 3rd party data service.
 */
class Service {
  constructor(options) {
    this.paginate = options.paginate || {};
  }

  setup(app) {
    this.app = app;
  }

  find(params) {
    /*
      Standard Feathers service preamble, adapted from feathers-sequelize.
     */

    const paginate = params && typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
    const getFilter = feathersQueryFilters(params.query, paginate);
    const filters = getFilter.filters;
    const query = getFilter.query;

    // Seconds elapsed between each decoded row; for reconstructing row time based on message time
    const timeInterval = query.time_interval | 0;

    // Prepare criteria for message service
    const msgQuery = Object.assign({}, query);
    delete msgQuery.compact;
    delete msgQuery.time_edit;
    delete msgQuery.time_interval;
    delete msgQuery.$limit;
    delete msgQuery.$sort;

    let editor;
    if (typeof query.time_edit === 'string') editor = new Editor(query.time_edit);

    const res = {
      limit: filters.$limit,
      data: []
    };

    return this.app.service(`/messages`).find({ query: msgQuery }).then(msgRes => {
      /*
        Prepare and return response.
       */

      let step = Promise.resolve();

      msgRes.data.forEach(msgData => {
        if (!msgData.decoded) return;

        step = step.then(() => {
          return new Promise(resolve => {
            setImmediate(() => {
              let time;
              if (editor && msgData.message && msgData.message.header && msgData.message.header.timeDate) {
                time = editor.edit(moment(msgData.message.header.timeDate).utc()).valueOf();
              }

              msgData.decoded.forEach(row => {
                const item = {
                  data: row
                };

                if (typeof time === 'number') {
                  item.time = {
                    date: new Date(time),
                    offset: 0

                    // Messages are always in descending order
                  };time -= timeInterval * 1000;
                }

                res.data.push(item);
              });

              resolve();
            });
          });
        });
      });

      return step;
    }).then(() => {
      // Sort and trim
      if (typeof filters.$sort === 'object' && typeof filters.$sort.time !== 'undefined') {
        res.data = filters.$sort.time === -1 ? res.data.sort(dateSortPredicateDesc) : res.data.sort(dateSortPredicateAsc);
      }
      if (res.data.length > filters.$limit) res.data.length = filters.$limit;

      return res;
    });
  }
}

module.exports = function () {
  return function () {
    const app = this;
    const services = app.get('services');

    if (services.series) {
      app.use('/series', new Service({
        paginate: services.series.paginate
      }));

      // Get the wrapped service object, bind hooks
      const seriesService = app.service('/series');

      seriesService.before(hooks.before);
      seriesService.after(hooks.after);
    }
  };
}();