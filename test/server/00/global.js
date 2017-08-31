const chai = require('chai')

global.assert = chai.assert
global.expect = chai.expect
global.main = require('../../../dist/server/main.js')
