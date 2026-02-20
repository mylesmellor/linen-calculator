import { useState } from 'react'
import { Package, AlertTriangle, CheckCircle, Search, ShoppingCart, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { LINEN_CATEGORIES } from '../data/defaultData'
import Tooltip from './Tooltip'

export default function InventoryPage({ activeItems, inventory, updateInventory, customItems, calculations, markAsOrdered, orderHistory, deleteOrderRecord }) {
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { grandTotals, grandTotal, grandTotalInStock, grandTotalToOrder } = calculations

  // Build the list of items that need ordering
  const itemsToOrder = {}
  activeItems.forEach((item) => {
    const toOrder = grandTotals[item]?.toOrder || 0
    if (toOrder > 0) itemsToOrder[item] = toOrder
  })
  const hasItemsToOrder = Object.keys(itemsToOrder).length > 0

  const handleMarkAsOrdered = () => {
    markAsOrdered(itemsToOrder)
    setShowConfirm(false)
  }
  const filteredItems = activeItems.filter(
    (item) => item.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (item) => {
    const required = grandTotals[item]?.total || 0
    const stock = inventory[item] || 0
    if (required === 0) return 'unused'
    if (stock >= required) return 'sufficient'
    if (stock > 0) return 'low'
    return 'none'
  }

  const statusCounts = {
    sufficient: activeItems.filter((i) => getStatus(i) === 'sufficient').length,
    low: activeItems.filter((i) => getStatus(i) === 'low').length,
    none: activeItems.filter((i) => getStatus(i) === 'none').length,
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <p className="text-gray-500 mt-1">
          Track your current linen stock levels and see what needs ordering
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-primary-600">{grandTotal.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Total Required</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-5 text-center">
          <div className="text-3xl font-bold text-orange-600">{grandTotalInStock.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">In Stock</div>
        </div>
        <div className={`bg-white rounded-xl shadow-sm p-5 text-center ${grandTotalToOrder > 0 ? 'border-2 border-red-200' : 'border-2 border-green-200'}`}>
          <div className={`text-3xl font-bold ${grandTotalToOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {grandTotalToOrder.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">To Order</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="flex justify-center gap-3 text-sm">
            <span className="text-green-600 font-bold">{statusCounts.sufficient}</span>
            <span className="text-amber-600 font-bold">{statusCounts.low}</span>
            <span className="text-red-600 font-bold">{statusCounts.none}</span>
          </div>
          <div className="flex justify-center gap-3 text-[10px] text-gray-400 mt-1">
            <span>Stocked</span>
            <span>Low</span>
            <span>None</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
        />
      </div>

      {/* Inventory by category */}
      {Object.entries(LINEN_CATEGORIES).map(([key, category]) => {
        const categoryItems = category.items.filter(
          (item) => filteredItems.includes(item) && activeItems.includes(item)
        )
        if (categoryItems.length === 0) return null

        return (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide p-5 pb-3">
              {category.label}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Item</th>
                    <th className="text-center px-3 py-2 font-semibold text-primary-700 w-24">Required</th>
                    <th className="text-center px-3 py-2 font-semibold text-orange-600 w-32">
                      In Stock
                      <Tooltip text="Enter your current stock count" />
                    </th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 w-24">To Order</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((item) => {
                    const required = grandTotals[item]?.total || 0
                    const stock = inventory[item] || 0
                    const toOrder = Math.max(0, required - stock)
                    const status = getStatus(item)

                    return (
                      <tr key={item} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">{item}</td>
                        <td className="text-center px-3 py-3 text-gray-600">{required}</td>
                        <td className="text-center px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            value={stock || ''}
                            onChange={(e) =>
                              updateInventory(item, Math.max(0, parseInt(e.target.value) || 0))
                            }
                            placeholder="0"
                            className="w-20 mx-auto px-3 py-1.5 border border-gray-300 rounded-md text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        </td>
                        <td className={`text-center px-3 py-3 font-bold ${toOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {toOrder}
                        </td>
                        <td className="text-center px-3 py-3">
                          {status === 'sufficient' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <CheckCircle size={12} /> OK
                            </span>
                          )}
                          {status === 'low' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              <AlertTriangle size={12} /> Low
                            </span>
                          )}
                          {status === 'none' && required > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              <AlertTriangle size={12} /> None
                            </span>
                          )}
                          {status === 'unused' && (
                            <span className="text-[10px] font-bold uppercase text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Custom items */}
      {(() => {
        const customFiltered = customItems.filter(
          (item) => filteredItems.includes(item) && activeItems.includes(item)
        )
        if (customFiltered.length === 0) return null

        return (
          <div className="bg-amber-50 rounded-xl shadow-sm border-2 border-amber-300 overflow-hidden">
            <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide p-5 pb-3">
              Custom Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-100/50 border-y border-amber-200">
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Item</th>
                    <th className="text-center px-3 py-2 font-semibold text-primary-700 w-24">Required</th>
                    <th className="text-center px-3 py-2 font-semibold text-orange-600 w-32">In Stock</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 w-24">To Order</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customFiltered.map((item) => {
                    const required = grandTotals[item]?.total || 0
                    const stock = inventory[item] || 0
                    const toOrder = Math.max(0, required - stock)
                    const status = getStatus(item)

                    return (
                      <tr key={item} className="border-b border-amber-200 hover:bg-amber-100/30">
                        <td className="px-4 py-3 font-medium text-gray-700">
                          <span className="flex items-center gap-1.5">
                            {item}
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">Custom</span>
                          </span>
                        </td>
                        <td className="text-center px-3 py-3 text-gray-600">{required}</td>
                        <td className="text-center px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            value={stock || ''}
                            onChange={(e) =>
                              updateInventory(item, Math.max(0, parseInt(e.target.value) || 0))
                            }
                            placeholder="0"
                            className="w-20 mx-auto px-3 py-1.5 border border-amber-300 rounded-md text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        </td>
                        <td className={`text-center px-3 py-3 font-bold ${toOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {toOrder}
                        </td>
                        <td className="text-center px-3 py-3">
                          {status === 'sufficient' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <CheckCircle size={12} /> OK
                            </span>
                          )}
                          {status === 'low' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              <AlertTriangle size={12} /> Low
                            </span>
                          )}
                          {status === 'none' && required > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              <AlertTriangle size={12} /> None
                            </span>
                          )}
                          {status === 'unused' && (
                            <span className="text-[10px] font-bold uppercase text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Mark as Ordered */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-green-600" />
              Stock Ordering
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {hasItemsToOrder
                ? `${Object.keys(itemsToOrder).length} items need ordering (${Object.values(itemsToOrder).reduce((s, q) => s + q, 0).toLocaleString()} units total)`
                : 'All items are fully stocked'}
            </p>
          </div>
          {hasItemsToOrder && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm"
            >
              <ShoppingCart size={18} />
              Mark as Ordered
            </button>
          )}
        </div>

        {/* Confirmation panel */}
        {showConfirm && hasItemsToOrder && (
          <div className="mt-4 border-t border-green-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              This will add the following quantities to your current stock and save a record:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {Object.entries(itemsToOrder).map(([item, qty]) => (
                <div key={item} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-700 truncate mr-2">{item}</span>
                  <span className="font-bold text-green-700">+{qty}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMarkAsOrdered}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm"
              >
                <CheckCircle size={18} />
                Confirm Order Received
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order History */}
      {orderHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-500" />
              <span className="font-semibold text-gray-800">Order History</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {orderHistory.length} {orderHistory.length === 1 ? 'order' : 'orders'}
              </span>
            </div>
            {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showHistory && (
            <div className="border-t border-gray-100">
              {orderHistory.map((record) => {
                const date = new Date(record.date)
                return (
                  <div key={record.id} className="border-b border-gray-100 last:border-b-0 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-800">
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                          {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-600">
                          +{record.totalItems.toLocaleString()} items
                        </span>
                        <button
                          onClick={() => deleteOrderRecord(record.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(record.items).map(([item, qty]) => (
                        <span key={item} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {item}: <span className="font-bold">+{qty}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
