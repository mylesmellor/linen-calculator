import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="text-gray-400 hover:text-primary-600 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Help"
      >
        <HelpCircle size={16} />
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg w-64 text-left">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  )
}
