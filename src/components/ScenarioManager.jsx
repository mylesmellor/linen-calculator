import { useState } from 'react'
import { Save, FolderOpen, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

export default function ScenarioManager({
  scenarioName,
  setScenarioName,
  savedScenarios,
  saveScenario,
  loadScenario,
  deleteScenario,
  resetToDefaults,
}) {
  const [isOpen, setIsOpen] = useState(false)

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
