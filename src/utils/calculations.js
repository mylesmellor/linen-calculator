const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const toNonNegativeInt = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.floor(num))
}

export const toUnitPrice = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, num)
}

export const toParLevel = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 1
  return clamp(num, 0.5, 10)
}

export const toMargin = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return clamp(num, 0, 200)
}

export function buildCalculations({
  properties,
  activeItems,
  parLevel,
  unitPrices = {},
  margin = 40,
  inventory = {},
}) {
  const safeParLevel = toParLevel(parLevel)
  const safeMargin = toMargin(margin)

  const propertyResults = properties.map((property) => {
    const safeStays = toNonNegativeInt(property.stays)
    const itemResults = {}
    let propertyTotal = 0
    let propertyCost = 0

    activeItems.forEach((item) => {
      const perStay = toNonNegativeInt(property.items?.[item] ?? 0)
      const subtotal = perStay * safeStays
      const withPar = Math.ceil(subtotal * safeParLevel)
      const price = toUnitPrice(unitPrices[item] ?? 0)
      const itemCost = withPar * price

      itemResults[item] = { perStay, stays: safeStays, subtotal, withPar, itemCost }
      propertyTotal += withPar
      propertyCost += itemCost
    })

    const propertyChargeToOwner = propertyCost * (1 + safeMargin / 100)

    return {
      ...property,
      stays: safeStays,
      itemResults,
      propertyTotal,
      propertyCost,
      propertyChargeToOwner,
    }
  })

  const grandTotals = {}
  activeItems.forEach((item) => {
    let total = 0
    let totalBeforePar = 0

    propertyResults.forEach((pr) => {
      total += pr.itemResults[item]?.withPar || 0
      totalBeforePar += pr.itemResults[item]?.subtotal || 0
    })

    const price = toUnitPrice(unitPrices[item] ?? 0)
    const inStock = toNonNegativeInt(inventory[item] ?? 0)
    const toOrder = Math.max(0, total - inStock)
    grandTotals[item] = {
      total,
      totalBeforePar,
      cost: total * price,
      inStock,
      toOrder,
      orderCost: toOrder * price,
    }
  })

  const grandTotal = Object.values(grandTotals).reduce((sum, g) => sum + g.total, 0)
  const grandTotalBeforePar = Object.values(grandTotals).reduce(
    (sum, g) => sum + g.totalBeforePar,
    0
  )
  const grandTotalCost = Object.values(grandTotals).reduce((sum, g) => sum + g.cost, 0)
  const grandTotalInStock = Object.values(grandTotals).reduce((sum, g) => sum + g.inStock, 0)
  const grandTotalToOrder = Object.values(grandTotals).reduce((sum, g) => sum + g.toOrder, 0)
  const grandTotalOrderCost = Object.values(grandTotals).reduce((sum, g) => sum + g.orderCost, 0)
  const grandTotalChargeToOwner = grandTotalCost * (1 + safeMargin / 100)

  return {
    propertyResults,
    grandTotals,
    grandTotal,
    grandTotalBeforePar,
    grandTotalCost,
    grandTotalChargeToOwner,
    grandTotalInStock,
    grandTotalToOrder,
    grandTotalOrderCost,
    safeParLevel,
    safeMargin,
  }
}
