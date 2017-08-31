/**
 * Tests for dds-pool library
 */

const ddsPool = require('../../../dist/server/lib/dds-pool')

describe('DDS pool library', function () {
  it('should get shared pool', function () {
    const pool = ddsPool.sharedPool()

    expect(pool.options).to.deep.include({
      numSlots: 2,
      password: process.env.DDS_PASS,
      username: process.env.DDS_USER
    })
    expect(pool.slots).to.have.lengthOf(2)
  })

  it('should get priority slots', function () {
    const slots = [
      {id: 'A', client: {isConnected: true}, queue: {items: [1, 2, 3, 4]}},
      {id: 'B', client: {}, queue: {items: [1, 2, 3]}},
      {id: 'C', client: {isConnected: true}, queue: {items: [1, 2, 3]}},
      {id: 'D', client: {}, queue: {items: [1, 2]}},
      {id: 'E', client: {isConnected: true}, queue: {items: [1, 2]}}
    ]
    const pool = new ddsPool.DDSPool({
      numSlots: slots.length
    })

    // Replace with mock slots for testing
    pool.slots = slots

    expect(pool.prioritySlots.map(slot => slot.id)).to.have.ordered.members(['E', 'D', 'C', 'B', 'A'])
    expect(pool.prioritySlot).to.include({
      id: 'E'
    })
  })
})
