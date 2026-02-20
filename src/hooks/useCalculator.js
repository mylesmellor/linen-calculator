import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_PROPERTIES, DEFAULT_LINEN_ITEMS, createEmptyProperty } from '../data/defaultData'
import {
  buildCalculations,
  toMargin,
  toNonNegativeInt,
  toParLevel,
  toUnitPrice,
} from '../utils/calculations'

function getNextPropertyId(properties) {
  const existingIds = new Set(properties.map((p) => String(p.id)))
  let nextNumericId = 1

  properties.forEach((p) => {
    const num = Number(p.id)
    if (Number.isInteger(num) && num >= nextNumericId) {
      nextNumericId = num + 1
    }
  })

  while (existingIds.has(String(nextNumericId))) {
    nextNumericId += 1
  }

  return String(nextNumericId)
}

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
  const setParLevelSafe = useCallback((value) => setParLevel(toParLevel(value)), [setParLevel])
  const setMarginSafe = useCallback((value) => setMargin(toMargin(value)), [setMargin])

  const updateInventory = useCallback(
    (itemName, qty) => {
      setInventory((prev) => ({ ...prev, [itemName]: toNonNegativeInt(qty) }))
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
          updated[item] = toNonNegativeInt(updated[item] || 0) + toNonNegativeInt(qty)
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
      setUnitPrices((prev) => ({ ...prev, [itemName]: toUnitPrice(price) }))
    },
    [setUnitPrices]
  )

  const addProperty = useCallback(() => {
    setProperties((prev) => [...prev, createEmptyProperty(getNextPropertyId(prev))])
  }, [setProperties])

  const duplicateProperty = useCallback(
    (id) => {
      setProperties((prev) => {
        const source = prev.find((p) => p.id === id)
        if (!source) return prev

        const duplicated = {
          ...source,
          id: getNextPropertyId(prev),
          name: source.name ? `${source.name} (Copy)` : 'Copied Property',
          items: { ...source.items },
        }
        return [...prev, duplicated]
      })
    },
    [setProperties]
  )

  const removeProperty = useCallback(
    (id) => {
      setProperties((prev) => prev.filter((p) => p.id !== id))
    },
    [setProperties]
  )

  const updateProperty = useCallback(
    (id, field, value) => {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          if (field === 'stays') return { ...p, stays: toNonNegativeInt(value) }
          return { ...p, [field]: value }
        })
      )
    },
    [setProperties]
  )

  const updatePropertyItem = useCallback(
    (propertyId, itemName, quantity) => {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, items: { ...p.items, [itemName]: toNonNegativeInt(quantity) } }
            : p
        )
      )
    },
    [setProperties]
  )

  const updateAllPropertiesItem = useCallback(
    (itemName, quantity) => {
      const safeQuantity = toNonNegativeInt(quantity)
      setProperties((prev) =>
        prev.map((p) => ({
          ...p,
          items: { ...p.items, [itemName]: safeQuantity },
        }))
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
  const calculations = useMemo(
    () =>
      buildCalculations({
        properties,
        activeItems,
        parLevel,
        unitPrices,
        margin,
        inventory,
      }),
    [properties, activeItems, parLevel, unitPrices, margin, inventory]
  )

  // Save/Load scenarios
  const saveScenario = useCallback(() => {
    const normalizedName = scenarioName.trim()
    if (!normalizedName) return

    const scenario = {
      id: Date.now().toString(),
      name: normalizedName,
      date: new Date().toISOString(),
      properties,
      parLevel,
      activeItems,
      customItems,
    }
    setSavedScenarios((prev) => {
      const nameKey = normalizedName.toLowerCase()
      const withoutSameName = prev.filter((s) => s.name.trim().toLowerCase() !== nameKey)
      return [scenario, ...withoutSameName]
    })
  }, [scenarioName, properties, parLevel, activeItems, customItems, setSavedScenarios])

  const loadScenario = useCallback(
    (scenario) => {
      setProperties(scenario.properties)
      setParLevelSafe(scenario.parLevel)
      setActiveItems(scenario.activeItems)
      setCustomItems(scenario.customItems || [])
      setScenarioName(scenario.name)
    },
    [setProperties, setParLevelSafe, setActiveItems, setCustomItems, setScenarioName]
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
      setParLevelSafe(snap.parLevel)
      setActiveItems(snap.activeItems)
      setCustomItems(snap.customItems || [])
      setScenarioName(record.scenarioName)
    },
    [setProperties, setParLevelSafe, setActiveItems, setCustomItems, setScenarioName]
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
    setParLevelSafe(1)
    setActiveItems(DEFAULT_LINEN_ITEMS)
    setCustomItems([])
    setScenarioName('Default Scenario')
  }, [setProperties, setParLevelSafe, setActiveItems, setCustomItems, setScenarioName])

  return {
    properties,
    parLevel,
    setParLevel: setParLevelSafe,
    scenarioName,
    setScenarioName,
    savedScenarios,
    activeItems,
    allItems,
    customItems,
    calculations,
    addProperty,
    duplicateProperty,
    removeProperty,
    updateProperty,
    updatePropertyItem,
    updateAllPropertiesItem,
    addCustomItem,
    removeCustomItem,
    toggleItem,
    unitPrices,
    updateUnitPrice,
    margin,
    setMargin: setMarginSafe,
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
