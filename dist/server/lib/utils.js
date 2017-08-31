'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configTimerSeconds = configTimerSeconds;
/**
 * NOAA API utilities and helpers.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */

const random = require('lodash/random');

function configTimerSeconds({ timerSeconds }) {
  let s = 60;

  if (typeof timerSeconds === 'number') {
    s = timerSeconds;
  } else if (Array.isArray(timerSeconds) && timerSeconds.length > 1) {
    s = random(timerSeconds[0], timerSeconds[1]);
  }

  return s;
}