import React, { forwardRef, useRef, useEffect, useState } from 'react'
import { useLang } from '../../hooks/useLang'

/* ==========================================================================
   SAASHAKTI 3D FORM ELEMENTS
   Pure CSS @keyframes animations -- no framer-motion.
   Components: Input3D, Select3D, Toggle3D, Radio3D, Checkbox3D,
              TextArea3D, OptionGrid3D, Button3D
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. Input3D -- Floating label, focus glow, error/success states
// ---------------------------------------------------------------------------

interface Input3DProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  error?: string
  success?: boolean
  wrapperClassName?: string
}

export const Input3D = forwardRef<HTMLInputElement, Input3DProps>(
  ({ label, error, success, wrapperClassName = '', id, value, ...rest }, ref) => {
    const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`
    const hasValue = value !== undefined && value !== null && String(value) !== ''

    return (
      <div className={`input-3d-wrapper ${wrapperClassName}`}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            value={value}
            className={`input-3d peer ${
              error ? 'input-3d-error input-3d-shake' : ''
            } ${success ? 'input-3d-success' : ''} ${label ? 'pt-6 pb-2' : ''}`}
            placeholder={label ? ' ' : rest.placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />

          {/* Floating label */}
          {label && (
            <label
              htmlFor={inputId}
              className={`input-3d-floating-label ${hasValue ? 'input-3d-floating-label-active' : ''}`}
            >
              {label}
            </label>
          )}

          {/* Success checkmark */}
          {success && !error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 animate-fadeIn" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="input-3d-error-msg"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input3D.displayName = 'Input3D'

// ---------------------------------------------------------------------------
// 2. Select3D -- Custom styled select with animated chevron
// ---------------------------------------------------------------------------

interface Select3DProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string
  error?: string
  wrapperClassName?: string
  children: React.ReactNode
}

export const Select3D = forwardRef<HTMLSelectElement, Select3DProps>(
  ({ label, error, wrapperClassName = '', id, value, children, ...rest }, ref) => {
    const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`
    const hasValue = value !== undefined && value !== null && String(value) !== ''

    return (
      <div className={`input-3d-wrapper ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm text-slate-600 mb-1.5 block font-medium"
          >
            {label}
          </label>
        )}
        <div className="relative select-3d-wrapper">
          <select
            ref={ref}
            id={selectId}
            value={value}
            className={`select-3d ${error ? 'input-3d-error input-3d-shake' : ''} ${
              hasValue ? 'select-3d-has-value' : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...rest}
          >
            {children}
          </select>
          {/* Custom animated chevron */}
          <span className="select-3d-chevron" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="input-3d-error-msg" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select3D.displayName = 'Select3D'

// ---------------------------------------------------------------------------
// 3. Toggle3D -- Yes/No pill-shaped toggle group
// ---------------------------------------------------------------------------

interface Toggle3DProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  labelLeft?: boolean
}

export function Toggle3D({ label, value, onChange, labelLeft = true }: Toggle3DProps) {
  const { t } = useLang()
  const yesLabel = t('yes')
  const noLabel = t('no')

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200/60 last:border-b-0">
      {labelLeft && (
        <span className="text-base text-slate-600 pr-3 leading-snug flex-1 min-w-0">
          {label}
        </span>
      )}
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`toggle-3d px-5 py-2.5 text-sm min-w-[56px] ${
            value ? 'toggle-3d-active' : 'toggle-3d-inactive'
          }`}
          aria-pressed={value}
          aria-label={`${label}: ${yesLabel}`}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`toggle-3d px-5 py-2.5 text-sm min-w-[56px] ${
            !value ? 'toggle-3d-active' : 'toggle-3d-inactive'
          }`}
          aria-pressed={!value}
          aria-label={`${label}: ${noLabel}`}
        >
          {noLabel}
        </button>
      </div>
      {!labelLeft && (
        <span className="text-base text-slate-600 pl-3 leading-snug flex-1 min-w-0">
          {label}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Radio3D -- Custom radio buttons with 3D press effect
// ---------------------------------------------------------------------------

interface Radio3DProps {
  name: string
  options: { key: string; label: string; icon?: React.ReactNode }[]
  value: string
  onChange: (v: string) => void
}

export function Radio3D({ name, options, value, onChange }: Radio3DProps) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const isSelected = opt.key === value
        return (
          <label
            key={opt.key}
            className={`radio-3d ${isSelected ? 'radio-3d-active' : 'radio-3d-inactive'}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.key}
              checked={isSelected}
              onChange={() => onChange(opt.key)}
              className="sr-only"
              aria-checked={isSelected}
            />
            <span className={`radio-3d-dot ${isSelected ? 'radio-3d-dot-active' : ''}`}>
              {isSelected && <span className="radio-3d-dot-inner" />}
            </span>
            {opt.icon && <span className="text-lg flex-shrink-0">{opt.icon}</span>}
            <span className="font-medium text-base">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Checkbox3D -- Animated checkmark with stroke-dasharray
// ---------------------------------------------------------------------------

interface Checkbox3DProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  id?: string
}

export function Checkbox3D({ label, checked, onChange, id }: Checkbox3DProps) {
  const cbId = id || `cb-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label htmlFor={cbId} className="checkbox-3d-label">
      <input
        type="checkbox"
        id={cbId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        aria-checked={checked}
      />
      <span className={`checkbox-3d-box ${checked ? 'checkbox-3d-box-checked' : ''}`}>
        {checked && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="checkbox-3d-check-svg"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-base text-slate-700">{label}</span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// 6. TextArea3D -- Auto-growing textarea with focus effects
// ---------------------------------------------------------------------------

interface TextArea3DProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string
  error?: string
  wrapperClassName?: string
}

export const TextArea3D = forwardRef<HTMLTextAreaElement, TextArea3DProps>(
  ({ label, error, wrapperClassName = '', id, value, onChange, ...rest }, ref) => {
    const textareaId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    const setRefs = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    }

    // Auto-grow
    useEffect(() => {
      const el = internalRef.current
      if (el) {
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      }
    }, [value])

    return (
      <div className={`input-3d-wrapper ${wrapperClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="text-sm text-slate-600 mb-1.5 block font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          value={value}
          onChange={onChange}
          className={`input-3d resize-none overflow-hidden ${error ? 'input-3d-error input-3d-shake' : ''}`}
          rows={3}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${textareaId}-error`} className="input-3d-error-msg" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
TextArea3D.displayName = 'TextArea3D'

// ---------------------------------------------------------------------------
// 7. OptionGrid3D
// ---------------------------------------------------------------------------

const columnClasses: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

interface OptionGrid3DProps {
  options: { key: string; label: string; icon?: React.ReactNode }[]
  value: string
  onChange: (v: string) => void
  columns?: 2 | 3 | 4
}

export function OptionGrid3D({ options, value, onChange, columns = 2 }: OptionGrid3DProps) {
  return (
    <div className={`grid ${columnClasses[columns]} gap-3`} role="radiogroup">
      {options.map((opt) => {
        const isSelected = opt.key === value
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`toggle-3d flex-col gap-1.5 py-4 px-3 option-grid-3d-item ${
              isSelected ? 'toggle-3d-active' : 'toggle-3d-inactive'
            }`}
            role="radio"
            aria-checked={isSelected}
          >
            {opt.icon && <span className="text-lg">{opt.icon}</span>}
            <span className={`text-sm font-medium leading-tight ${isSelected ? 'text-white' : ''}`}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 8. Button3D
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
  border: '1.5px solid rgba(0, 0, 0, 0.1)',
  color: 'rgba(0, 0, 0, 0.6)',
}

interface Button3DProps {
  children: React.ReactNode
  variant: 'primary' | 'secondary' | 'success' | 'purple' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button3D({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  icon,
  loading = false,
  type = 'button',
}: Button3DProps) {
  const isGhost = variant === 'ghost'

  return (
    <button
      type={type}
      className={`${variantClasses[variant]} ${className}`}
      style={isGhost ? ghostStyle : undefined}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="btn-3d-spinner"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
    </button>
  )
}
