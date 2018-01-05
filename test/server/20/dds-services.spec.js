/**
 * Tests for DDS services
 */

const ddsPool = require('../../../dist/server/lib/dds-pool')
const moment = require('moment')
const now = moment().utc()
const since = now.clone().subtract(5, 'd').startOf('d')
const until = since.clone().add(2, 'd')

const DATE_FORMAT = 'YYYY/DDDD HH:mm:ss'
const DCP_ADDRESS = 'BEC0035C'

describe('Service /dds', function () {
  this.timeout(60000)

  after(function () {
    return ddsPool.sharedPool().disconnectAll()
  })

  describe('/dds/dcp-block-ext #find()', function () {
    it('should find using date', function () {
      return main.app.service('/dds/dcp-block-ext').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toDate(),
        drs_until: until.toDate()
      }}).then(res => {
        expect(res).to.have.nested.property('criteria_options.dcp_address', DCP_ADDRESS)
        expect(res).to.have.nested.property('response_data.0.platformId', DCP_ADDRESS)
      })
    })

    it('should find using ISO string', function () {
      return main.app.service('/dds/dcp-block-ext').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toISOString(),
        drs_until: until.toISOString()
      }}).then(res => {
        expect(res).to.have.nested.property('criteria_options.dcp_address', DCP_ADDRESS)
        expect(res).to.have.nested.property('response_data.0.platformId', DCP_ADDRESS)
      })
    })

    it('should find using Julian day', function () {
      return main.app.service('/dds/dcp-block-ext').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.format(DATE_FORMAT),
        drs_until: until.format(DATE_FORMAT)
      }}).then(res => {
        expect(res).to.have.nested.property('criteria_options.dcp_address', DCP_ADDRESS)
        expect(res).to.have.nested.property('response_data.0.platformId', DCP_ADDRESS)
      })
    })

    it('should find using time operators', function () {
      return main.app.service('/dds/dcp-block-ext').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        }
      }}).then(res => {
        expect(res).to.have.nested.property('criteria_options.dcp_address', DCP_ADDRESS)
        expect(res).to.have.nested.property('response_data.0.platformId', DCP_ADDRESS)
      })
    })
  })
})
