import { Check } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Properties' },
  { num: 2, label: 'Linen Items' },
  { num: 3, label: 'Quantities' },
  { num: 4, label: 'Results' },
]

export default function StepIndicator({ currentStep, onStepClick }) {
  return (
    <nav className="flex items-center justify-center mb-8" aria-label="Progress">
      <ol className="flex items-center space-x-2 sm:space-x-4">
        {STEPS.map((step, idx) => {
          const isComplete = currentStep > step.num
          const isCurrent = currentStep === step.num

          return (
            <li key={step.num} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${
                    currentStep > step.num ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              )}
              <button
                onClick={() => onStepClick(step.num)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-primary-500 text-white shadow-md'
                    : isComplete
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                    isCurrent
                      ? 'bg-white text-primary-600'
                      : isComplete
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 text-white'
                  }`}
                >
                  {isComplete ? <Check size={14} /> : step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
