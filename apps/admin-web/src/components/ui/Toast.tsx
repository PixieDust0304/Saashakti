import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  message: string | null
  onDismiss: () => void
  duration?: number
}

/**
 * Minimal fire-and-forget toast. Sits above the fixed bottom nav bar
 * (which uses z-50) at z-[60]. Auto-dismisses after `duration` ms or
 * when the user taps the close button. Re-setting `message` restarts
 * the timer automatically via the effect dependency.
 */
export default function Toast({ message, onDismiss, duration = 4500 }: Props) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 w-[min(92vw,420px)] pointer-events-auto"
          role="alert"
          aria-live="polite"
        >
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(194, 65, 12, 0.96)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.12)',
              color: 'white',
            }}
          >
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm leading-snug">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
