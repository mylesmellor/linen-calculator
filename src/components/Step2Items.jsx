import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Check, Square, CheckSquare, Sparkles, X } from 'lucide-react'
import { LINEN_CATEGORIES } from '../data/defaultData'

export default function Step2Items({
  activeItems,
  allItems,
  customItems,
  toggleItem,
  addCustomItem,
  removeCustomItem,
  onPrev,
  onNext,
}) {
  const [newItem, setNewItem] = useState('')

  const handleAddCustom = () => {
    if (newItem.trim() && !allItems.includes(newItem.trim())) {
      addCustomItem(newItem.trim())
      setNewItem('')
    }
  }

  const selectAll = () => {
    allItems.forEach((item) => {
      if (!activeItems.includes(item)) toggleItem(item)
    })
  }

  const deselectAll = () => {
    allItems.forEach((item) => {
      if (activeItems.includes(item)) toggleItem(item)
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Select Linen Items</h2>
        <p className="text-gray-500 mt-1">
          Choose which linen items to include in your calculation
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={selectAll}
          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
        >
          Deselect All
        </button>
      </div>

      {/* Categories */}
      {Object.entries(LINEN_CATEGORIES).map(([key, category]) => (
        <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {category.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {category.items.map((item) => {
              const isActive = activeItems.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => toggleItem(item)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                    isActive
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {isActive ? (
                    <CheckSquare size={20} className="text-primary-500 shrink-0" />
                  ) : (
                    <Square size={20} className="text-gray-400 shrink-0" />
                  )}
                  <span className="font-medium text-sm">{item}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom items */}
      {customItems.length > 0 && (
        <div className="bg-amber-50 rounded-xl shadow-sm border-2 border-amber-300 ring-1 ring-amber-200 p-6">
          <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Custom Items
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {customItems.map((item) => {
              const isActive = activeItems.includes(item)
              return (
                <div
                  key={item}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-amber-400 bg-amber-100 text-amber-800'
                      : 'border-amber-200 bg-white text-gray-500'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {isActive ? (
                      <CheckSquare size={20} className="text-amber-600 shrink-0" />
                    ) : (
                      <Square size={20} className="text-gray-400 shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{item}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                  </button>
                  <button
                    onClick={() => removeCustomItem(item)}
                    className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    aria-label={`Delete ${item}`}
                    title="Remove custom item"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add custom item */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-amber-300 p-6">
        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Plus size={16} className="text-amber-500" />
          Add Custom Item
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="e.g. Mattress Protector"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <button
            onClick={handleAddCustom}
            disabled={!newItem.trim() || allItems.includes(newItem.trim())}
            className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

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
          disabled={activeItems.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next: Quantities
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
