import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { DEFAULT_LINEN_ITEMS } from '../data/defaultData'

export default function Step3Quantities({
  properties,
  activeItems,
  parLevel,
  updatePropertyItem,
  updateAllPropertiesItem,
  calculations,
  onPrev,
  onNext,
}) {
  const [expandedProperty, setExpandedProperty] = useState(properties[0]?.id || null)
  const [bulkItem, setBulkItem] = useState(activeItems[0] || '')
  const [bulkQty, setBulkQty] = useState(0)
  const selectedBulkItem = activeItems.includes(bulkItem) ? bulkItem : activeItems[0] || ''

  const toggleExpand = (id) => {
    setExpandedProperty((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configure Quantities</h2>
        <p className="text-gray-500 mt-1">
          Set the quantity of each linen item needed per stay at each property
        </p>
      </div>

      {/* Live summary bar */}
      <div className="bg-primary-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md ring-2 ring-primary-300">
        <div>
          <div className="text-sm opacity-90">Total items required</div>
          <div className="text-3xl font-bold">{calculations.grandTotal.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90">PAR {parLevel}x applied</div>
          <div className="text-sm opacity-75">
            Base: {calculations.grandTotalBeforePar.toLocaleString()} items
          </div>
        </div>
      </div>

      {/* Bulk apply tool */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-primary-200 p-5">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Apply To All Properties
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Item</label>
            <select
              value={selectedBulkItem}
              onChange={(e) => setBulkItem(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-48"
            >
              {activeItems.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity Per Stay</label>
            <input
              type="number"
              min="0"
              value={bulkQty}
              onChange={(e) => setBulkQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button
            onClick={() => selectedBulkItem && updateAllPropertiesItem(selectedBulkItem, bulkQty)}
            disabled={!selectedBulkItem}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Apply To All
          </button>
        </div>
      </div>

      {/* Property accordions */}
      {properties.map((property) => {
        const isExpanded = expandedProperty === property.id
        const propCalc = calculations.propertyResults.find((p) => p.id === property.id)

        return (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(property.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">
                  {property.name || 'Unnamed Property'}
                </span>
                <span className="text-sm text-gray-500">
                  {property.stays} stay{property.stays !== 1 ? 's' : ''}
                </span>
                {property.notes && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    ({property.notes})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-600">
                  {propCalc?.propertyTotal.toLocaleString() || 0} items
                </span>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeItems.map((item) => {
                    const qty = property.items[item] || 0
                    const result = propCalc?.itemResults[item]
                    const isCustom = !DEFAULT_LINEN_ITEMS.includes(item)

                    return (
                      <div
                        key={item}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCustom
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="text-sm font-medium text-gray-700 truncate flex items-center gap-1.5">
                            {item}
                            {isCustom && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                            )}
                          </div>
                          {result && result.withPar > 0 && (
                            <div className="text-xs text-gray-400">
                              {result.perStay} x {result.stays} stays
                              {parLevel > 1 && ` x ${parLevel}`} = {result.withPar}
                            </div>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) =>
                            updatePropertyItem(
                              property.id,
                              item,
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all shadow-sm"
        >
          View Results
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
