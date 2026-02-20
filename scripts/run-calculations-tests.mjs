import assert from 'node:assert/strict'
import {
  buildCalculations,
  toMargin,
  toNonNegativeInt,
  toParLevel,
  toUnitPrice,
} from '../src/utils/calculations.js'

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

runTest('sanitizers clamp and normalize values', () => {
  assert.equal(toNonNegativeInt(3.9), 3)
  assert.equal(toNonNegativeInt(-1), 0)
  assert.equal(toNonNegativeInt('bad'), 0)

  assert.equal(toUnitPrice(1.25), 1.25)
  assert.equal(toUnitPrice(-10), 0)

  assert.equal(toParLevel(0), 0.5)
  assert.equal(toParLevel(12), 10)
  assert.equal(toParLevel('bad'), 1)

  assert.equal(toMargin(-5), 0)
  assert.equal(toMargin(250), 200)
})

runTest('buildCalculations computes PAR totals, costs, and to-order correctly', () => {
  const result = buildCalculations({
    properties: [
      {
        id: '1',
        name: 'A',
        stays: 2,
        items: { Towels: 3, Sheets: 1 },
      },
      {
        id: '2',
        name: 'B',
        stays: 1,
        items: { Towels: 1, Sheets: 2 },
      },
    ],
    activeItems: ['Towels', 'Sheets'],
    parLevel: 1.5,
    unitPrices: { Towels: 2, Sheets: 5 },
    margin: 40,
    inventory: { Towels: 5, Sheets: 1 },
  })

  assert.equal(result.grandTotals.Towels.totalBeforePar, 7)
  assert.equal(result.grandTotals.Towels.total, 11)
  assert.equal(result.grandTotals.Towels.toOrder, 6)
  assert.equal(result.grandTotals.Towels.orderCost, 12)

  assert.equal(result.grandTotals.Sheets.totalBeforePar, 4)
  assert.equal(result.grandTotals.Sheets.total, 6)
  assert.equal(result.grandTotals.Sheets.toOrder, 5)
  assert.equal(result.grandTotals.Sheets.orderCost, 25)

  assert.equal(result.grandTotal, 17)
  assert.equal(result.grandTotalBeforePar, 11)
  assert.equal(result.grandTotalCost, 52)
  assert.equal(result.grandTotalChargeToOwner, 72.8)
  assert.equal(result.grandTotalToOrder, 11)
  assert.equal(result.grandTotalOrderCost, 37)
})

runTest('buildCalculations sanitizes invalid numeric inputs', () => {
  const result = buildCalculations({
    properties: [
      {
        id: '1',
        name: 'Invalid',
        stays: -3,
        items: { Item: -2 },
      },
    ],
    activeItems: ['Item'],
    parLevel: -1,
    unitPrices: { Item: -4 },
    margin: 999,
    inventory: { Item: -20 },
  })

  assert.equal(result.safeParLevel, 0.5)
  assert.equal(result.safeMargin, 200)
  assert.equal(result.grandTotals.Item.totalBeforePar, 0)
  assert.equal(result.grandTotals.Item.total, 0)
  assert.equal(result.grandTotals.Item.cost, 0)
  assert.equal(result.grandTotals.Item.inStock, 0)
  assert.equal(result.grandTotals.Item.toOrder, 0)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
