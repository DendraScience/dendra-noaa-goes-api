'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sharedPool = sharedPool;
/**
 * Utility class to manage a pool of DDS client instances.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/dds-pool
 */

const { errors } = require('feathers-errors');
const dds = require('@dendra-science/goes-dds-client');
const tq = require('@dendra-science/task-queue');

class DDSPool {
  constructor(options) {
    this.options = options;
    this.logger = this.options.logger;

    this.slots = Array.apply(null, {
      length: this.options.numSlots
    }).map((el, id) => {
      const slot = {
        id,
        client: new dds.DDSClient(),
        queue: new tq.TaskQueue({
          maxRetries: 0
        })
      };
      slot.client.on('error', this._onErrorHandler.bind(this, slot));

      return slot;
    });
  }

  _onErrorHandler(slot, err) {
    this.logger.error(`DDSPool [Slot ${slot.id}]`, err);
  }

  get prioritySlots() {
    return this.slots.sort((a, b) => {
      /*
        Order by queue length ASC, connection status DESC.
         i.e. Slots with the fewest tasks and a connected client take priority.
       */
      return a.queue.items.length - b.queue.items.length || (b.client.isConnected >>> 0) - (a.client.isConnected >>> 0);
    });
  }

  get prioritySlot() {
    return this.prioritySlots[0];
  }

  _disconnectTask({ data }) {
    const pool = data.pool;
    const slot = data.slot;
    const client = slot.client;

    /*
      Set up a promise chain to say goodbye and disconnect.
     */
    let step = Promise.resolve();

    if (client.isConnected) {
      pool.logger.info(`DDSPool [Slot ${slot.id}]: Disconnecting`);

      step = step.then(() => {
        return client.request(dds.types.IdGoodbye);
      }).then(res => {
        return client.disconnect();
      });
    }

    return step.then(() => {
      pool.logger.info(`DDSPool [Slot ${slot.id}]: Cleaning up`);

      delete slot.authData;
      delete slot.time;
    });
  }

  disconnectAll(slots = this.slots) {
    return Promise.all(slots.map(slot => {
      delete slot.time;

      return slot.queue.push(this._disconnectTask, {
        pool: this,
        slot
      });
    }));
  }

  _executeTask({ data }) {
    const pool = data.pool;
    const slot = data.slot;
    const client = slot.client;

    /*
      Set up a promise chain to connect, authorize, and execute any tasks.
     */
    let step = Promise.resolve();

    if (!client.isConnected) {
      step = step.then(() => {
        pool.logger.info(`DDSPool [Slot ${slot.id}]: Connecting`);

        return client.connect();
      });
    }

    if (!(client.isConnected && slot.authData)) {
      step = step.then(() => {
        pool.logger.info(`DDSPool [Slot ${slot.id}]: Authenticating`);

        return client.request(dds.types.IdAuthHello, {
          algorithm: 'sha256',
          password: pool.options.password,
          username: pool.options.username
        });
      }).then(res => {
        return res.data();
      }).then(data => {
        const d = data[0];
        if (d && d.serverCode) throw new errors.NotAuthenticated(d.explanation, d);

        slot.authData = data;

        pool.logger.info(`DDSPool [Slot ${slot.id}]: Authenticated`, data);
      });
    }

    return step.then(() => {
      slot.time = Date.now();
      return data.cb(slot);
    });
  }

  execute(cb) {
    return Promise.resolve(this.prioritySlot).then(slot => {
      if (!slot) throw new Error('No slots available');

      this.logger.info(`DDSPool [Slot ${slot.id}]: Enqueuing task`);

      return slot.queue.push(this._executeTask, {
        cb,
        pool: this,
        slot
      });
    });
  }
}

exports.DDSPool = DDSPool;
let pool;
function sharedPool(options) {
  if (!pool) pool = new DDSPool(options);
  return pool;
}