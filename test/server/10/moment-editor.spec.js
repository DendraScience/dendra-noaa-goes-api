/**
 * Tests for moment-editor library
 */

const Editor = require('../../../dist/server/lib/moment-editor').default
const moment = require('moment')

describe('Moment editor library', function () {
  const m = moment('2017-08-30T17:35:34.660Z').utc()

  it('should edit to start of next day (defaults)', function () {
    const ed = new Editor('so,ad')

    expect(ed.edit(m).toISOString()).to.equal('2017-08-31T00:00:00.000Z')
  })

  it('should edit to start of next day (explicit)', function () {
    const ed = new Editor('so_d,ad_1_d')

    expect(ed.edit(m).toISOString()).to.equal('2017-08-31T00:00:00.000Z')
  })

  it('should edit to end of previous day (defaults)', function () {
    const ed = new Editor('su,eo')

    expect(ed.edit(m).toISOString()).to.equal('2017-08-29T23:59:59.999Z')
  })

  it('should edit to end of previous day (explicit)', function () {
    const ed = new Editor('su_1_d,eo_d')

    expect(ed.edit(m).toISOString()).to.equal('2017-08-29T23:59:59.999Z')
  })
})
