import { Plus, Trash2, ChevronRight } from 'lucide-react'
import Tooltip from './Tooltip'
import { PAR_LEVELS } from '../data/defaultData'

export default function Step1Properties({
  properties,
  parLevel,
  setParLevel,
  addProperty,
  removeProperty,
  updateProperty,
  onNext,
}) {
  const isValid = properties.length > 0 && properties.some((p) => p.name.trim())

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Property Setup</h2>
        <p className="text-gray-500 mt-1">
          Add your properties and the number of guest stays for the period
        </p>
      </div>

      {/* PAR Level */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-primary-200 ring-1 ring-primary-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-semibold text-gray-700">PAR Level</label>
          <Tooltip text="PAR (Periodic Automatic Replenishment) level is a multiplier on your base linen needs. A PAR of 3x means for every item in use, you have two more in rotation (laundry/reserve). Use 1x if you just want exact totals for a period." />
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={parLevel}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && val > 0) setParLevel(val)
              }}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
            <span className="text-gray-500 font-medium">x multiplier</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PAR_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setParLevel(level.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                parLevel === level.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="font-bold text-lg">{level.label}</div>
              <div className="text-xs mt-1 opacity-75">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-4">
        {properties.map((property, idx) => (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Property {idx + 1}
              </h3>
              {properties.length > 1 && (
                <button
                  onClick={() => removeProperty(property.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  aria-label="Remove property"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => updateProperty(property.id, 'name', e.target.value)}
                  placeholder="e.g. Holmlea"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Stays
                  <Tooltip text="How many guest turnovers (changeovers) are expected in this period. Each stay requires a fresh set of linen." />
                </label>
                <input
                  type="number"
                  min="0"
                  value={property.stays}
                  onChange={(e) =>
                    updateProperty(property.id, 'stays', Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={property.notes}
                  onChange={(e) => updateProperty(property.id, 'notes', e.target.value)}
                  placeholder="e.g. Sleeps 4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addProperty}
        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all w-full justify-center"
      >
        <Plus size={20} />
        Add Property
      </button>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next: Linen Items
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
