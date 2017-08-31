'use strict';

const { configTimerSeconds } = require('../../lib/utils');
const { sharedPool } = require('../../lib/dds-pool');

module.exports = function () {
  return function () {
    const app = this;
    const tasks = app.get('tasks');

    if (tasks.dds_grooming) {
      /*
        Get config settings; assume reasonable defaults.
       */

      const config = tasks.dds_grooming;

      let lifetimeSeconds = 60;
      if (typeof config.lifetimeSeconds === 'number') lifetimeSeconds = config.lifetimeSeconds;

      const handleError = function (err) {
        app.logger.error(err);
      };

      const scheduleTask = function () {
        const timerSeconds = configTimerSeconds(config);

        app.logger.info(`Task [dds_grooming]: Starting in ${timerSeconds} seconds`);

        setTimeout(() => {
          app.logger.info('Task [dds_grooming]: Running...');

          const pool = sharedPool();
          const start = Date.now() - lifetimeSeconds * 1000;
          const slots = pool.slots.filter(slot => {
            return typeof slot.time === 'number' && slot.time < start;
          });

          Promise.resolve().then(() => {
            if (slots.length > 0) return pool.disconnectAll(slots);

            app.logger.info('Task [dds_grooming]: No slots found');
          }).catch(handleError).then(scheduleTask);
        }, timerSeconds * 1000);
      };

      app.set('taskReady', Promise.resolve(app.get('middlewareReady')).then(scheduleTask));
    }
  };
}();