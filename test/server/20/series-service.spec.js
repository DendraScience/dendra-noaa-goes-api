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

describe('Service /series', function () {
  this.timeout(60000)

  after(function () {
    return ddsPool.sharedPool().disconnectAll()
  })

  describe('/series #find()', function () {
    it('should find using date', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toDate(),
        drs_until: until.toDate(),
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.data').to.be.an('array')
      })
    })

    it('should find using ISO string', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.toISOString(),
        drs_until: until.toISOString(),
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.data').to.be.an('array')
      })
    })

    it('should find using Julian day', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        drs_since: since.format(DATE_FORMAT),
        drs_until: until.format(DATE_FORMAT),
        decode_format: 'fp2_27',
        decode_slice: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.data').to.be.an('array')
      })
    })

    it('should find using time operators with $sort', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        decode_format: 'fp2_27',
        decode_slice: 1,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        time_edit: 'so_h,su_8_h',
        time_interval: 600,
        $sort: {
          time: 1
        }
      }}).then(res => {
        expect(res).to.have.nested.property('data').with.lengthOf.above(1)

        const td1 = res.data[0].time.date
        const td2 = res.data[res.data.length - 1].time.date

        expect(td2).to.be.above(td1)
      })
    })

    it('should find using time operators with limit', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        decode_format: 'fp2_27',
        decode_slice: 1,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        $limit: 1
      }}).then(res => {
        expect(res).to.have.nested.property('data').with.lengthOf(1)
      })
    })

    it('should find using time operators with decoded columns', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        decode_columns: 'val1,val2',
        decode_format: 'fp2_27',
        decode_slice: 1,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        time_edit: 'so_h,su_8_h',
        time_interval: 600
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.data').to.be.an('object')
        expect(res).to.have.nested.property('data.0.data.val1').to.be.a('number')
        expect(res).to.have.nested.property('data.0.data.val2').to.be.a('number')
        expect(res).to.have.nested.property('data.0.data.c_3').to.be.a('number')
        expect(res).to.have.nested.property('data.0.time.date').to.be.a('date')
        expect(res).to.have.nested.property('data.0.time.offset').to.be.a('number')
      })
    })

    it('should find using time operators with compact format', function () {
      return main.app.service('/series').find({query: {
        dcp_address: DCP_ADDRESS,
        decode_columns: 'val1,val2',
        decode_format: 'fp2_27',
        decode_slice: 1,
        time: {
          $gte: since.toISOString(),
          $lt: until.toISOString()
        },
        time_edit: 'so_h,su_8_h',
        time_interval: 600,
        compact: true
      }}).then(res => {
        expect(res).to.have.nested.property('data.0.d').to.be.an('object')
        expect(res).to.have.nested.property('data.0.d.val1').to.be.a('number')
        expect(res).to.have.nested.property('data.0.d.val2').to.be.a('number')
        expect(res).to.have.nested.property('data.0.d.c_3').to.be.a('number')
        expect(res).to.have.nested.property('data.0.t').to.be.a('date')
        expect(res).to.have.nested.property('data.0.o').to.be.a('number')
      })
    })
  })
})
