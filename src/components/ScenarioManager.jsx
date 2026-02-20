import { useMemo, useState } from 'react'
import { Save, FolderOpen, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { buildCalculations } from '../utils/calculations'

export default function ScenarioManager({
  scenarioName,
  setScenarioName,
  savedScenarios,
  saveScenario,
  loadScenario,
  deleteScenario,
  resetToDefaults,
  currentSnapshot,
  unitPrices,
  margin,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [compareLeftId, setCompareLeftId] = useState('__current__')
  const [compareRightId, setCompareRightId] = useState(savedScenarios[0]?.id || '')

  const scenarioOptions = useMemo(
    () => [
      { id: '__current__', name: `Current: ${currentSnapshot.name || 'Untitled'}` },
      ...savedScenarios.map((s) => ({ id: s.id, name: s.name })),
    ],
    [savedScenarios, currentSnapshot.name]
  )
  const selectedLeftId = scenarioOptions.some((opt) => opt.id === compareLeftId)
    ? compareLeftId
    : '__current__'
  const selectedRightId = scenarioOptions.some((opt) => opt.id === compareRightId)
    ? compareRightId
    : savedScenarios[0]?.id || ''

  const getScenarioById = (id) => {
    if (!id) return null
    if (id === '__current__') return currentSnapshot
    return savedScenarios.find((s) => s.id === id) || null
  }

  const summarizeScenario = (scenario) => {
    if (!scenario) return null
    const calculations = buildCalculations({
      properties: scenario.properties || [],
      activeItems: scenario.activeItems || [],
      parLevel: scenario.parLevel ?? 1,
      unitPrices,
      margin,
      inventory: {},
    })
    return {
      properties: (scenario.properties || []).length,
      activeItems: (scenario.activeItems || []).length,
      parLevel: calculations.safeParLevel,
      totalItems: calculations.grandTotal,
      estCost: calculations.grandTotalCost,
      itemTotals: calculations.grandTotals,
    }
  }

  const leftScenario = getScenarioById(selectedLeftId)
  const rightScenario = getScenarioById(selectedRightId)
  const leftSummary = summarizeScenario(leftScenario)
  const rightSummary = summarizeScenario(rightScenario)

  const itemDiffs = useMemo(() => {
    if (!leftSummary || !rightSummary) return []

    const allItems = new Set([
      ...Object.keys(leftSummary.itemTotals),
      ...Object.keys(rightSummary.itemTotals),
    ])

    return [...allItems]
      .map((item) => {
        const left = leftSummary.itemTotals[item]?.total || 0
        const right = rightSummary.itemTotals[item]?.total || 0
        return { item, delta: right - left, left, right }
      })
      .filter((row) => row.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 8)
  }, [leftSummary, rightSummary])

  const fmtCurrency = (val) =>
    val.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-gray-500" />
          <span className="font-medium text-gray-700">Scenarios</span>
          {savedScenarios.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {savedScenarios.length} saved
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Save current */}
          <div className="flex gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
            <button
              onClick={saveScenario}
              disabled={!scenarioName.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50 transition-all"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
              title="Reset to spreadsheet defaults"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          {/* Saved scenarios list */}
          {savedScenarios.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Saved Scenarios
              </h4>
              {savedScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-700">{scenario.name}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(scenario.date).toLocaleDateString()} &middot;{' '}
                      {scenario.properties.length} properties
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => loadScenario(scenario)}
                      className="px-3 py-1.5 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors font-medium"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedScenarios.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Compare Scenarios
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Scenario A</label>
                  <select
                    value={selectedLeftId}
                    onChange={(e) => setCompareLeftId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    {scenarioOptions.map((opt) => (
                      <option key={`left-${opt.id}`} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Scenario B</label>
                  <select
                    value={selectedRightId}
                    onChange={(e) => setCompareRightId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Select scenario...</option>
                    {scenarioOptions.map((opt) => (
                      <option key={`right-${opt.id}`} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {leftSummary && rightSummary && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">Metric</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-600">A</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-600">B</th>
                          <th className="text-right px-3 py-2 font-semibold text-primary-700">B - A</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-600">Properties</td>
                          <td className="px-3 py-2 text-right">{leftSummary.properties}</td>
                          <td className="px-3 py-2 text-right">{rightSummary.properties}</td>
                          <td className="px-3 py-2 text-right font-medium text-primary-700">
                            {rightSummary.properties - leftSummary.properties}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-600">Active Items</td>
                          <td className="px-3 py-2 text-right">{leftSummary.activeItems}</td>
                          <td className="px-3 py-2 text-right">{rightSummary.activeItems}</td>
                          <td className="px-3 py-2 text-right font-medium text-primary-700">
                            {rightSummary.activeItems - leftSummary.activeItems}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-600">PAR Level</td>
                          <td className="px-3 py-2 text-right">{leftSummary.parLevel}x</td>
                          <td className="px-3 py-2 text-right">{rightSummary.parLevel}x</td>
                          <td className="px-3 py-2 text-right font-medium text-primary-700">
                            {(rightSummary.parLevel - leftSummary.parLevel).toFixed(2)}x
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-600">Total Items</td>
                          <td className="px-3 py-2 text-right">{leftSummary.totalItems.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{rightSummary.totalItems.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-semibold text-primary-700">
                            {(rightSummary.totalItems - leftSummary.totalItems).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-gray-600">Est. Cost</td>
                          <td className="px-3 py-2 text-right">{fmtCurrency(leftSummary.estCost)}</td>
                          <td className="px-3 py-2 text-right">{fmtCurrency(rightSummary.estCost)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-primary-700">
                            {fmtCurrency(rightSummary.estCost - leftSummary.estCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {itemDiffs.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Largest Item Changes (B vs A)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {itemDiffs.map((row) => (
                          <div
                            key={row.item}
                            className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-md px-3 py-2 text-xs"
                          >
                            <span className="text-gray-700 truncate mr-2">{row.item}</span>
                            <span className={`font-semibold ${row.delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {row.delta > 0 ? '+' : ''}
                              {row.delta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {savedScenarios.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              No saved scenarios yet. Save your current configuration to load it later.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
