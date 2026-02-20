import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Bed, ListChecks, SlidersHorizontal, BarChart3, PoundSterling, Save, Clock } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to Linen Calculator',
    description:
      'This tool helps you calculate exactly how much linen you need across all your holiday rental properties. Let\'s take a quick tour of the key features.',
    icon: Bed,
    color: 'bg-primary-600',
  },
  {
    title: 'Step 1: Set Up Properties',
    description:
      'Start by adding your properties and the number of guest stays expected for the period. You can also set a PAR level multiplier to account for linen in use, in the laundry, and in reserve.',
    icon: Bed,
    color: 'bg-primary-600',
    highlights: ['PAR level', 'Number of stays'],
  },
  {
    title: 'Step 2: Choose Linen Items',
    description:
      'Select which linen items to include from the pre-loaded list (bedding, towels, kitchen items). You can also add your own custom items — these are highlighted in amber so they\'re easy to spot.',
    icon: ListChecks,
    color: 'bg-blue-600',
    highlights: ['Custom items', 'Select/deselect'],
  },
  {
    title: 'Step 3: Set Quantities',
    description:
      'For each property, set how many of each item is needed per stay. The live total at the top updates in real-time as you adjust quantities. Expand each property to see and edit its items.',
    icon: SlidersHorizontal,
    color: 'bg-violet-600',
    highlights: ['Per-stay quantities', 'Live totals'],
  },
  {
    title: 'Step 4: View Results',
    description:
      'See a full breakdown of your linen requirements — by item, by property, and grand totals. Visual charts make it easy to see where the biggest needs are.',
    icon: BarChart3,
    color: 'bg-emerald-600',
    highlights: ['Bar chart', 'Detailed tables'],
  },
  {
    title: 'Cost Estimation & Owner Charges',
    description:
      'Enter unit prices per item to see estimated costs. Set your margin percentage (default 40%) and the app calculates the charge to each property owner, with a full breakdown by cottage.',
    icon: PoundSterling,
    color: 'bg-amber-600',
    highlights: ['Unit prices', 'Margin %', 'Per-cottage charges'],
  },
  {
    title: 'Save, Export & History',
    description:
      'Save different scenarios to compare later. Export results as PDF or CSV. Every time you view results, a timestamped record is saved to your history so you can always look back at previous calculations.',
    icon: Save,
    color: 'bg-gray-700',
    highlights: ['Scenarios', 'PDF/CSV export', 'Email report', 'History'],
  },
  {
    title: 'You\'re All Set!',
    description:
      'Everything saves automatically to your browser. Start by setting up your properties on Step 1, then work through each step. You can jump between steps at any time using the progress bar at the top.',
    icon: Clock,
    color: 'bg-primary-600',
  },
]

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1
  const Icon = step.icon

  const handleNext = useCallback(() => {
    if (isLast) {
      setIsVisible(false)
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, onComplete])

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1)
  }, [isFirst])

  const handleSkip = useCallback(() => {
    setIsVisible(false)
    onComplete()
  }, [onComplete])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleSkip()
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNext, handlePrev, handleSkip])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close tour"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mb-5`}>
            <Icon size={28} className="text-white" />
          </div>

          {/* Step counter */}
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            {currentStep + 1} of {TOUR_STEPS.length}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-4">{step.description}</p>

          {/* Highlight tags */}
          {step.highlights && (
            <div className="flex flex-wrap gap-2 mb-6">
              {step.highlights.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-primary-500 w-6'
                    : idx < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-200'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div>
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isLast && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                >
                  Skip tour
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all text-sm shadow-sm"
              >
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
