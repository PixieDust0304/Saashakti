import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../hooks/useLang'

/* ==========================================================================
   SAASHAKTI 3D FORM ELEMENTS
   Three interactive components: Button3D, Toggle3D, OptionGrid3D
   Uses CSS classes from globals.css + framer-motion + Tailwind layout
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. Button3D
// ---------------------------------------------------------------------------

const variantClasses: Record<string, string> = {
  primary: 'btn-3d btn-3d-primary',
  secondary: 'btn-3d btn-3d-secondary',
  success: 'btn-3d btn-3d-success',
  purple: 'btn-3d btn-3d-purple',
  ghost: 'btn-3d',
}

const ghostStyle: React.CSSProperties = {
  background: 'transparent',
  boxShadow: 'none',
  border: '1.5px solid rgba(255, 255, 255, 0.15)',
  color: 'rgba(255, 255, 255, 0.8)',
}

export function Button3D({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  icon,
  loading = false,
}: {
  children: React.ReactNode
  variant: 'primary' | 'secondary' | 'success' | 'purple' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  loading?: boolean
}) {
  const isGhost = variant === 'ghost'

  return (
    <motion.button
      type="button"
      className={`${variantClasses[variant]} ${className}`}
      style={isGhost ? ghostStyle : undefined}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
                 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// 2. Toggle3D
// ---------------------------------------------------------------------------

export function Toggle3D({
  label,
  value,
  onChange,
  labelLeft = true,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  labelLeft?: boolean
}) {
  const { t } = useLang()

  const yesLabel = t('yes')
  const noLabel = t('no')

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Label */}
      {labelLeft && (
        <span className="text-white/80 text-base font-medium flex-1 min-w-0 truncate">
          {label}
        </span>
      )}

      {/* Toggle button pair */}
      <div className="flex gap-2 flex-shrink-0">
        <motion.button
          type="button"
          layout
          className={`toggle-3d ${value ? 'toggle-3d-active' : 'toggle-3d-inactive'}`}
          style={{ minWidth: '64px' }}
          onClick={() => onChange(true)}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`yes-${value}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {yesLabel}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          layout
          className={`toggle-3d ${!value ? 'toggle-3d-active' : 'toggle-3d-inactive'}`}
          style={{ minWidth: '64px' }}
          onClick={() => onChange(false)}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`no-${value}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {noLabel}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Label on right if labelLeft is false */}
      {!labelLeft && (
        <span className="text-white/80 text-base font-medium flex-1 min-w-0 truncate">
          {label}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. OptionGrid3D
// ---------------------------------------------------------------------------

const columnClasses: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

export function OptionGrid3D({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { key: string; label: string; icon?: React.ReactNode }[]
  value: string
  onChange: (v: string) => void
  columns?: 2 | 3 | 4
}) {
  return (
    <div className={`grid ${columnClasses[columns]} gap-3`}>
      {options.map((opt) => {
        const isSelected = opt.key === value

        return (
          <motion.button
            key={opt.key}
            type="button"
            layout
            onClick={() => onChange(opt.key)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
              relative rounded-2xl p-4 text-center font-medium text-base
              transition-colors duration-300 cursor-pointer select-none
              flex flex-col items-center justify-center gap-2
              min-h-touch overflow-hidden
              ${
                isSelected
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              }
            `}
            style={
              isSelected
                ? {
                    background:
                      'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    boxShadow: `
                      0 4px 0 #C2410C,
                      0 8px 24px rgba(249, 115, 22, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15)
                    `,
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.10)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.12)',
                  }
            }
          >
            {/* Top shine line on selected card */}
            {isSelected && (
              <motion.span
                layoutId="option-grid-shine"
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {opt.icon && (
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
            )}
            <span className="leading-snug">{opt.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
