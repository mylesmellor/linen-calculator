import { useState } from 'react'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { LINEN_CATEGORIES, DEFAULT_LINEN_ITEMS } from '../data/defaultData'
import Tooltip from './Tooltip'

export default function InventoryInput({ activeItems, inventory, updateInventory, customItems }) {
  const [isOpen, setIsOpen] = useState(true)

  const hasStock = Object.values(inventory).some((v) => v > 0)
  const totalStock = Object.entries(inventory).reduce(
    (sum, [item, qty]) => sum + (activeItems.includes(item) ? qty : 0),
    0
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 ring-1 ring-orange-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package size={20} className="text-orange-500" />
          <span className="font-semibold text-gray-800">Current Inventory</span>
          <Tooltip text="Enter how much linen you currently have in stock. The results will show what you need to order (required minus what you already have)." />
          {hasStock && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {totalStock.toLocaleString()} items in stock
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-4">
            Enter your current stock levels. Items where you have enough stock will be highlighted in the results.
          </p>

          {/* Standard categories */}
          {Object.entries(LINEN_CATEGORIES).map(([key, category]) => {
            const categoryItems = category.items.filter((item) => activeItems.includes(item))
            if (categoryItems.length === 0) return null

            return (
              <div key={key} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category.label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700 truncate mr-3">{item}</span>
                      <input
                        type="number"
                        min="0"
                        value={inventory[item] || ''}
                        onChange={(e) =>
                          updateInventory(item, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        placeholder="0"
                        className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Custom items */}
          {customItems.filter((item) => activeItems.includes(item)).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                Custom Items
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {customItems
                  .filter((item) => activeItems.includes(item))
                  .map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <span className="text-sm font-medium text-gray-700 truncate mr-3">{item}</span>
                      <input
                        type="number"
                        min="0"
                        value={inventory[item] || ''}
                        onChange={(e) =>
                          updateInventory(item, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        placeholder="0"
                        className="w-20 px-3 py-1.5 border border-amber-300 rounded-md text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
