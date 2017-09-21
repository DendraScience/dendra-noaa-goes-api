/**
 * Tests for message service
 */

const ddsPool = require('../../../dist/server/lib/dds-pool')
const moment = require('moment')
const now = moment().utc()
const since = now.clone().subtract(5, 'd').startOf('d')
const until = since.clone().add(2, 'd')

const DATE_FORMAT = 'YYYY/DDD HH:mm:ss'
const DCP_ADDRESS = 'BEC0035C'

describe('Service /messages', function () {
  this.timeout(60000)

  after(function () {
    return ddsPool.sharedPool().disconnectAll()
  })

  describe('/messages #find()', function () {
    it('should find using date', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toDate(),
        drs_until: until.toDate()
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.message.header.address', DCP_ADDRESS)
        expect(res).to.have.nested.property('data.0.message.body').with.lengthOf.above(0)
      })
    })

    it('should find using ISO string', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toISOString(),
        drs_until: until.toISOString()
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.message.header.address', DCP_ADDRESS)
        expect(res).to.have.nested.property('data.0.message.body').with.lengthOf.above(0)
      })
    })

    it('should find using Julian day', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.format(DATE_FORMAT),
        drs_until: until.format(DATE_FORMAT)
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.message.header.address', DCP_ADDRESS)
        expect(res).to.have.nested.property('data.0.message.body').with.lengthOf.above(0)
      })
    })

    it('should find using time operators with $sort', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        $sort: {
          time: 1
        }
      }}).then(res => {
        expect(res).to.have.nested.property('data').with.lengthOf.above(1)

        const td1 = res.data[0].message.header.timeDate
        const td2 = res.data[res.data.length - 1].message.header.timeDate

        expect(td2).to.be.above(td1)
      })
    })

    it('should find using time operators with limit', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        $limit: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data').with.lengthOf(1)
      })
    })

    it('should find using time operators with decoding', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        body_encoding: 'hex',
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.message.body').to.be.a('string')
        expect(res).to.have.nested.property('data.0.decoded.0').to.be.an('array')
      })
    })

    it('should find using time operators with decoded columns', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        body_encoding: 'hex',
        decode_columns: 'val1,val2',
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.message.body').to.be.a('string')
        expect(res).to.have.nested.property('data.0.decoded.0').to.be.an('object')
        expect(res).to.have.nested.property('data.0.decoded.0.val1').to.be.a('number')
        expect(res).to.have.nested.property('data.0.decoded.0.val2').to.be.a('number')
        expect(res).to.have.nested.property('data.0.decoded.0.c_3').to.be.a('number')
      })
    })

    it('should find using time operators with compact format', function () {
      return main.app.service('/messages').find({query: {
        dcp_address: DCP_ADDRESS,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        compact: true,
        decode_columns: 'val1,val2',
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.d.body').to.be.a('string')
        expect(res).to.have.nested.property('data.0.da.0').to.be.an('object')
        expect(res).to.have.nested.property('data.0.da.0.val1').to.be.a('number')
        expect(res).to.have.nested.property('data.0.da.0.val2').to.be.a('number')
        expect(res).to.have.nested.property('data.0.da.0.c_3').to.be.a('number')
        expect(res).to.have.nested.property('data.0.t').to.be.a('date')
      })
    })
  })
})
