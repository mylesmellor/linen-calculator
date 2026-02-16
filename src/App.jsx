import { useState, useRef } from 'react'
import { useCalculator } from './hooks/useCalculator'
import { useLocalStorage } from './hooks/useLocalStorage'
import StepIndicator from './components/StepIndicator'
import Step1Properties from './components/Step1Properties'
import Step2Items from './components/Step2Items'
import Step3Quantities from './components/Step3Quantities'
import Step4Results from './components/Step4Results'
import InventoryPage from './components/InventoryPage'
import ScenarioManager from './components/ScenarioManager'
import History from './components/History'
import OnboardingTour from './components/OnboardingTour'
import { Bed, HelpCircle, Calculator, Package } from 'lucide-react'

function App() {
  const [tab, setTab] = useState('calculator')
  const [step, setStep] = useState(1)
  const calc = useCalculator()
  const lastSavedStep = useRef(null)
  const [tourCompleted, setTourCompleted] = useLocalStorage('linen-tour-completed', false)
  const [showTour, setShowTour] = useState(!tourCompleted)

  const goTo = (s) => {
    // Auto-save to history when arriving at results (step 4), once per visit
    if (s === 4 && lastSavedStep.current !== 4) {
      calc.saveToHistory()
    }
    lastSavedStep.current = s
    setStep(s)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Bed size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Linen Calculator</h1>
              <p className="text-xs text-gray-500">Holiday property linen management</p>
            </div>
          </div>
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            title="Take the guided tour"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Tour</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setTab('calculator')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'calculator'
                ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calculator size={18} />
            Calculator
          </button>
          <button
            onClick={() => setTab('inventory')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'inventory'
                ? 'border-orange-500 text-orange-700 bg-orange-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package size={18} />
            Inventory
          </button>
        </div>
      </nav>

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          onComplete={() => {
            setShowTour(false)
            setTourCompleted(true)
          }}
        />
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'calculator' && (
          <>
            <div className="no-print">
              <StepIndicator currentStep={step} onStepClick={goTo} />
              <div className="mb-6">
                <ScenarioManager
                  scenarioName={calc.scenarioName}
                  setScenarioName={calc.setScenarioName}
                  savedScenarios={calc.savedScenarios}
                  saveScenario={calc.saveScenario}
                  loadScenario={calc.loadScenario}
                  deleteScenario={calc.deleteScenario}
                  resetToDefaults={calc.resetToDefaults}
                />
              </div>
              <div className="mb-6">
                <History
                  history={calc.history}
                  loadFromHistory={calc.loadFromHistory}
                  deleteHistoryRecord={calc.deleteHistoryRecord}
                  clearHistory={calc.clearHistory}
                />
              </div>
            </div>

            {step === 1 && (
              <Step1Properties
                properties={calc.properties}
                parLevel={calc.parLevel}
                setParLevel={calc.setParLevel}
                addProperty={calc.addProperty}
                removeProperty={calc.removeProperty}
                updateProperty={calc.updateProperty}
                onNext={() => goTo(2)}
              />
            )}

            {step === 2 && (
              <Step2Items
                activeItems={calc.activeItems}
                allItems={calc.allItems}
                customItems={calc.customItems}
                toggleItem={calc.toggleItem}
                addCustomItem={calc.addCustomItem}
                removeCustomItem={calc.removeCustomItem}
                onPrev={() => goTo(1)}
                onNext={() => goTo(3)}
              />
            )}

            {step === 3 && (
              <Step3Quantities
                properties={calc.properties}
                activeItems={calc.activeItems}
                parLevel={calc.parLevel}
                updatePropertyItem={calc.updatePropertyItem}
                calculations={calc.calculations}
                onPrev={() => goTo(2)}
                onNext={() => goTo(4)}
              />
            )}

            {step === 4 && (
              <Step4Results
                properties={calc.properties}
                activeItems={calc.activeItems}
                parLevel={calc.parLevel}
                calculations={calc.calculations}
                unitPrices={calc.unitPrices}
                updateUnitPrice={calc.updateUnitPrice}
                margin={calc.margin}
                setMargin={calc.setMargin}
                onPrev={() => goTo(3)}
              />
            )}
          </>
        )}

        {tab === 'inventory' && (
          <InventoryPage
            activeItems={calc.activeItems}
            inventory={calc.inventory}
            updateInventory={calc.updateInventory}
            customItems={calc.customItems}
            calculations={calc.calculations}
            markAsOrdered={calc.markAsOrdered}
            orderHistory={calc.orderHistory}
            deleteOrderRecord={calc.deleteOrderRecord}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
          Linen Calculator &middot; Built for holiday property management
        </div>
      </footer>
    </div>
  )
}

export default App
