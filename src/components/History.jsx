import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Trash2, Upload, AlertTriangle } from 'lucide-react'

export default function History({
  history,
  loadFromHistory,
  deleteHistoryRecord,
  clearHistory,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-500" />
          <span className="font-medium text-gray-700">Calculation History</span>
          {history.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {history.length} record{history.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              No history yet. Records are saved automatically when you view results.
            </p>
          ) : (
            <>
              {/* Clear all */}
              <div className="flex justify-end">
                {confirmClear ? (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-red-600">Clear all history?</span>
                    <button
                      onClick={() => { clearHistory(); setConfirmClear(false) }}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Clear all history
                  </button>
                )}
              </div>

              {history.map((record) => {
                const isExpanded = expandedId === record.id
                return (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center leading-tight">
                          <div className="text-xs font-bold text-primary-600">
                            {formatDate(record.date)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {formatTime(record.date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {record.scenarioName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {record.properties.length} properties &middot; PAR {record.parLevel}x
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary-600">
                          {record.grandTotal.toLocaleString()} items
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-3">
                        {/* Properties summary */}
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Properties:</span>{' '}
                          {record.properties
                            .map((p) => `${p.name || 'Unnamed'} (${p.stays} stays)`)
                            .join(', ')}
                        </div>

                        {/* Item totals */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {Object.entries(record.grandTotals)
                            .filter(([, v]) => v > 0)
                            .sort(([, a], [, b]) => b - a)
                            .map(([item, total]) => (
                              <div
                                key={item}
                                className="flex justify-between text-xs bg-white rounded px-2 py-1.5 border border-gray-100"
                              >
                                <span className="text-gray-600 truncate mr-2">{item}</span>
                                <span className="font-semibold text-gray-800">{total}</span>
                              </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => loadFromHistory(record)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-md text-xs font-medium hover:bg-primary-200 transition-colors"
                          >
                            <Upload size={12} />
                            Load this calculation
                          </button>
                          <button
                            onClick={() => deleteHistoryRecord(record.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md text-xs transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
