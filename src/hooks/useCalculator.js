import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_PROPERTIES, DEFAULT_LINEN_ITEMS, createEmptyProperty } from '../data/defaultData'

let nextId = 100

export function useCalculator() {
  const [properties, setProperties] = useLocalStorage('linen-properties', DEFAULT_PROPERTIES)
  const [parLevel, setParLevel] = useLocalStorage('linen-par-level', 1)
  const [scenarioName, setScenarioName] = useLocalStorage('linen-scenario-name', 'Default Scenario')
  const [savedScenarios, setSavedScenarios] = useLocalStorage('linen-saved-scenarios', [])
  const [activeItems, setActiveItems] = useLocalStorage('linen-active-items', DEFAULT_LINEN_ITEMS)
  const [customItems, setCustomItems] = useLocalStorage('linen-custom-items', [])

  const [unitPrices, setUnitPrices] = useLocalStorage('linen-unit-prices', {})
  const [margin, setMargin] = useLocalStorage('linen-margin', 40)
  const [inventory, setInventory] = useLocalStorage('linen-inventory', {})
  const [orderHistory, setOrderHistory] = useLocalStorage('linen-order-history', [])

  const updateInventory = useCallback(
    (itemName, qty) => {
      setInventory((prev) => ({ ...prev, [itemName]: qty }))
    },
    [setInventory]
  )

  const markAsOrdered = useCallback(
    (orderedItems) => {
      // orderedItems is an object { itemName: qty, ... }
      const record = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: orderedItems,
        totalItems: Object.values(orderedItems).reduce((sum, qty) => sum + qty, 0),
      }
      setOrderHistory((prev) => [record, ...prev])
      // Add ordered quantities to current inventory
      setInventory((prev) => {
        const updated = { ...prev }
        Object.entries(orderedItems).forEach(([item, qty]) => {
          updated[item] = (updated[item] || 0) + qty
        })
        return updated
      })
    },
    [setOrderHistory, setInventory]
  )

  const deleteOrderRecord = useCallback(
    (id) => {
      setOrderHistory((prev) => prev.filter((r) => r.id !== id))
    },
    [setOrderHistory]
  )

  const allItems = useMemo(() => [...DEFAULT_LINEN_ITEMS, ...customItems], [customItems])

  const updateUnitPrice = useCallback(
    (itemName, price) => {
      setUnitPrices((prev) => ({ ...prev, [itemName]: price }))
    },
    [setUnitPrices]
  )

  const addProperty = useCallback(() => {
    const id = String(nextId++)
    setProperties((prev) => [...prev, createEmptyProperty(id)])
  }, [setProperties])

  const removeProperty = useCallback(
    (id) => {
      setProperties((prev) => prev.filter((p) => p.id !== id))
    },
    [setProperties]
  )

  const updateProperty = useCallback(
    (id, field, value) => {
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      )
    },
    [setProperties]
  )

  const updatePropertyItem = useCallback(
    (propertyId, itemName, quantity) => {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, items: { ...p.items, [itemName]: quantity } }
            : p
        )
      )
    },
    [setProperties]
  )

  const addCustomItem = useCallback(
    (itemName) => {
      if (!allItems.includes(itemName) && itemName.trim()) {
        setCustomItems((prev) => [...prev, itemName.trim()])
        setActiveItems((prev) => [...prev, itemName.trim()])
        // Add the item to all properties with qty 0
        setProperties((prev) =>
          prev.map((p) => ({ ...p, items: { ...p.items, [itemName.trim()]: 0 } }))
        )
      }
    },
    [allItems, setCustomItems, setActiveItems, setProperties]
  )

  const removeCustomItem = useCallback(
    (itemName) => {
      setCustomItems((prev) => prev.filter((i) => i !== itemName))
      setActiveItems((prev) => prev.filter((i) => i !== itemName))
      setProperties((prev) =>
        prev.map((p) => {
          const { [itemName]: _, ...rest } = p.items
          return { ...p, items: rest }
        })
      )
    },
    [setCustomItems, setActiveItems, setProperties]
  )

  const toggleItem = useCallback(
    (itemName) => {
      setActiveItems((prev) =>
        prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
      )
    },
    [setActiveItems]
  )

  // Calculations
  const calculations = useMemo(() => {
    const propertyResults = properties.map((property) => {
      const itemResults = {}
      let propertyTotal = 0

      let propertyCost = 0

      activeItems.forEach((item) => {
        const perStay = property.items[item] || 0
        const subtotal = perStay * property.stays
        const withPar = Math.ceil(subtotal * parLevel)
        const price = unitPrices[item] || 0
        const itemCost = withPar * price
        itemResults[item] = { perStay, stays: property.stays, subtotal, withPar, itemCost }
        propertyTotal += withPar
        propertyCost += itemCost
      })

      const propertyChargeToOwner = propertyCost * (1 + margin / 100)

      return {
        ...property,
        itemResults,
        propertyTotal,
        propertyCost,
        propertyChargeToOwner,
      }
    })

    // Grand totals per item
    const grandTotals = {}
    activeItems.forEach((item) => {
      let total = 0
      let totalBeforePar = 0
      propertyResults.forEach((pr) => {
        total += pr.itemResults[item]?.withPar || 0
        totalBeforePar += pr.itemResults[item]?.subtotal || 0
      })
      const price = unitPrices[item] || 0
      const inStock = inventory[item] || 0
      const toOrder = Math.max(0, total - inStock)
      grandTotals[item] = { total, totalBeforePar, cost: total * price, inStock, toOrder, orderCost: toOrder * price }
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
    const grandTotalChargeToOwner = grandTotalCost * (1 + margin / 100)

    return { propertyResults, grandTotals, grandTotal, grandTotalBeforePar, grandTotalCost, grandTotalChargeToOwner, grandTotalInStock, grandTotalToOrder, grandTotalOrderCost }
  }, [properties, activeItems, parLevel, unitPrices, margin, inventory])

  // Save/Load scenarios
  const saveScenario = useCallback(() => {
    const scenario = {
      id: Date.now().toString(),
      name: scenarioName,
      date: new Date().toISOString(),
      properties,
      parLevel,
      activeItems,
      customItems,
    }
    setSavedScenarios((prev) => [...prev, scenario])
  }, [scenarioName, properties, parLevel, activeItems, customItems, setSavedScenarios])

  const loadScenario = useCallback(
    (scenario) => {
      setProperties(scenario.properties)
      setParLevel(scenario.parLevel)
      setActiveItems(scenario.activeItems)
      setCustomItems(scenario.customItems || [])
      setScenarioName(scenario.name)
    },
    [setProperties, setParLevel, setActiveItems, setCustomItems, setScenarioName]
  )

  const deleteScenario = useCallback(
    (id) => {
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id))
    },
    [setSavedScenarios]
  )

  // History
  const [history, setHistory] = useLocalStorage('linen-history', [])

  const saveToHistory = useCallback(() => {
    const record = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      scenarioName,
      parLevel,
      properties: properties.map((p) => ({ name: p.name, stays: p.stays })),
      activeItems,
      grandTotal: null, // filled below
      grandTotals: null,
      fullSnapshot: { properties, parLevel, activeItems, customItems },
    }
    // Calculate totals for the record
    let gt = 0
    const totals = {}
    activeItems.forEach((item) => {
      let itemTotal = 0
      properties.forEach((p) => {
        itemTotal += Math.ceil((p.items[item] || 0) * p.stays * parLevel)
      })
      totals[item] = itemTotal
      gt += itemTotal
    })
    record.grandTotal = gt
    record.grandTotals = totals
    setHistory((prev) => [record, ...prev])
  }, [scenarioName, parLevel, properties, activeItems, customItems, setHistory])

  const loadFromHistory = useCallback(
    (record) => {
      const snap = record.fullSnapshot
      setProperties(snap.properties)
      setParLevel(snap.parLevel)
      setActiveItems(snap.activeItems)
      setCustomItems(snap.customItems || [])
      setScenarioName(record.scenarioName)
    },
    [setProperties, setParLevel, setActiveItems, setCustomItems, setScenarioName]
  )

  const deleteHistoryRecord = useCallback(
    (id) => {
      setHistory((prev) => prev.filter((r) => r.id !== id))
    },
    [setHistory]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  const resetToDefaults = useCallback(() => {
    setProperties(DEFAULT_PROPERTIES)
    setParLevel(1)
    setActiveItems(DEFAULT_LINEN_ITEMS)
    setCustomItems([])
    setScenarioName('Default Scenario')
  }, [setProperties, setParLevel, setActiveItems, setCustomItems, setScenarioName])

  return {
    properties,
    parLevel,
    setParLevel,
    scenarioName,
    setScenarioName,
    savedScenarios,
    activeItems,
    allItems,
    customItems,
    calculations,
    addProperty,
    removeProperty,
    updateProperty,
    updatePropertyItem,
    addCustomItem,
    removeCustomItem,
    toggleItem,
    unitPrices,
    updateUnitPrice,
    margin,
    setMargin,
    inventory,
    updateInventory,
    markAsOrdered,
    orderHistory,
    deleteOrderRecord,
    saveScenario,
    loadScenario,
    deleteScenario,
    resetToDefaults,
    history,
    saveToHistory,
    loadFromHistory,
    deleteHistoryRecord,
    clearHistory,
  }
}
