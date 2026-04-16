import React, { useRef, useState, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GlassVariant = 'default' | 'saffron' | 'purple' | 'success' | 'dark'

export interface GlassCardProps {
  children: React.ReactNode
  /** Visual variant */
  variant?: GlassVariant
  /** Enable interactive hover lift */
  hover?: boolean
  /** Enable 3D tilt on mouse move / touch */
  tilt?: boolean
  /** Enable colored glow shadow matching variant */
  glow?: boolean
  className?: string
  onClick?: () => void
  /** Extra inline styles */
  style?: React.CSSProperties
  /** Accessible role override */
  role?: string
  /** Tab index override */
  tabIndex?: number
}

export interface GlassCardCompactProps {
  children: React.ReactNode
  variant?: GlassVariant
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export interface SchemeCardProps {
  /** Scheme name in Hindi */
  nameHi: string
  /** Scheme name in English */
  nameEn: string
  /** Department name */
  department: string
  /** Match score 0-100 */
  matchScore: number
  /** Annual value in INR */
  annualValue: number | null
  /** Benefit display string (e.g. "Rs 6,000") */
  benefitText: string
  /** Frequency label */
  frequencyText: string
  /** Is fully eligible (true) or partial (false) */
  isEligible: boolean
  /** Badge label */
  badgeLabel: string
  /** Explanation text */
  explanation: string
  /** Matched criteria list */
  matchedCriteria: string[]
  /** Missing criteria list */
  missingCriteria: string[]
  /** Documents required */
  documents: string[]
  /** Benefit description */
  benefitDescription: string
  /** Portal URL */
  portalUrl?: string
  /** Next best action text */
  nextAction?: string
  /** How-to-apply label */
  applyLabel: string
  /** Documents-needed label */
  documentsLabel: string
  /** Next-step label */
  nextStepLabel: string
  /** Is currently expanded */
  expanded: boolean
  /** Toggle expand callback */
  onExpand: () => void
  /** Display language */
  lang: string
  /** Stagger index for entrance delay */
  index: number
}

export interface StatCardProps {
  /** Lucide icon element */
  icon: React.ReactNode
  /** Numeric value to animate to */
  value: number
  /** Label text below value */
  label: string
  /** Prefix for display (e.g. "Rs ") */
  prefix?: string
  /** Suffix for display (e.g. "/year") */
  suffix?: string
  /** Color accent: 'saffron' | 'purple' | 'success' */
  color?: 'saffron' | 'purple' | 'success'
  /** Animation duration in ms */
  duration?: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TILT = 6

const VARIANT_CLASS_MAP: Record<GlassVariant, string> = {
  default: '',
  saffron: 'glass-card-saffron',
  purple: 'glass-card-purple',
  success: 'glass-card-success',
  dark: '',
}

const GLOW_SHADOW_MAP: Record<GlassVariant, string> = {
  default: '',
  saffron:
    '0 8px 32px rgba(0,0,0,0.08), 0 0 24px rgba(249,115,22,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
  purple:
    '0 8px 32px rgba(0,0,0,0.08), 0 0 24px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
  success:
    '0 8px 32px rgba(0,0,0,0.08), 0 0 24px rgba(19,136,8,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
  dark: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
}

// ---------------------------------------------------------------------------
// Animated Counter Hook (shared by StatCard and external consumers)
// ---------------------------------------------------------------------------

export function useAnimatedCounter(target: number, duration: number = 1800): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return value
}

// ---------------------------------------------------------------------------
// GlassCard -- base component
// ---------------------------------------------------------------------------

function GlassCard({
  children,
  variant = 'default',
  hover = false,
  tilt: enableTilt = false,
  glow = false,
  className = '',
  onClick,
  style,
  role: roleProp,
  tabIndex: tabProp,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltState, setTiltState] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  // ---- 3D tilt ----
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableTilt || !cardRef.current) return
      setIsHovered(true)
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)))
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)))
      setTiltState({ x: -ny * MAX_TILT, y: nx * MAX_TILT })
    },
    [enableTilt],
  )

  const handleMouseLeave = useCallback(() => {
    setTiltState({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enableTilt || !cardRef.current || e.touches.length === 0) return
      const touch = e.touches[0]
      setIsHovered(true)
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const nx = Math.max(-1, Math.min(1, (touch.clientX - cx) / (rect.width / 2)))
      const ny = Math.max(-1, Math.min(1, (touch.clientY - cy) / (rect.height / 2)))
      setTiltState({ x: -ny * MAX_TILT, y: nx * MAX_TILT })
    },
    [enableTilt],
  )

  const handleTouchEnd = useCallback(() => {
    setTiltState({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  // ---- Class assembly ----
  const variantClass = VARIANT_CLASS_MAP[variant]
  const darkBg = variant === 'dark'
  const classes = [
    'glass-card',
    variantClass,
    hover || onClick ? 'glass-card-hover' : '',
    onClick ? 'cursor-pointer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // ---- Tilt transform ----
  const tiltStyle: React.CSSProperties = enableTilt
    ? {
        transform: isHovered
          ? `perspective(800px) rotateX(${tiltState.x}deg) rotateY(${tiltState.y}deg)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered
          ? 'transform 0.12s ease-out'
          : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformStyle: 'preserve-3d' as const,
        willChange: 'transform',
      }
    : {}

  // ---- Glow shadow ----
  const glowStyle: React.CSSProperties =
    glow && variant !== 'default' ? { boxShadow: GLOW_SHADOW_MAP[variant] } : {}

  // ---- Dark variant overrides ----
  const darkStyle: React.CSSProperties = darkBg
    ? {
        background: 'rgba(10, 25, 41, 0.85)',
        borderColor: 'rgba(255,255,255,0.08)',
        color: '#E2E8F0',
      }
    : {}

  return (
    <div
      ref={cardRef}
      className={classes}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...tiltStyle,
        ...glowStyle,
        ...darkStyle,
        ...style,
      }}
      onClick={onClick}
      onMouseMove={enableTilt ? handleMouseMove : undefined}
      onMouseLeave={enableTilt ? handleMouseLeave : undefined}
      onTouchMove={enableTilt ? handleTouchMove : undefined}
      onTouchEnd={enableTilt ? handleTouchEnd : undefined}
      role={roleProp || (onClick ? 'button' : undefined)}
      tabIndex={tabProp !== undefined ? tabProp : onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// GlassCardCompact -- smaller padding for stat/summary cards
// ---------------------------------------------------------------------------

export function GlassCardCompact({
  children,
  variant = 'default',
  className = '',
  onClick,
  style,
}: GlassCardCompactProps) {
  return (
    <GlassCard
      variant={variant}
      hover={!!onClick}
      onClick={onClick}
      className={className}
      style={{ padding: '0.75rem 1rem', ...style }}
    >
      {children}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// SVG Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  score,
  size = 48,
  strokeWidth = 4,
  isEligible,
}: {
  score: number
  size?: number
  strokeWidth?: number
  isEligible: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    // Trigger animation after mount
    const timer = requestAnimationFrame(() => {
      setOffset(circumference - (score / 100) * circumference)
    })
    return () => cancelAnimationFrame(timer)
  }, [score, circumference])

  const color = isEligible ? '#138808' : '#D97706'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
      aria-label={`Match score ${score}%`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Animated progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: 'center',
          fontSize: size * 0.26,
          fontWeight: 700,
          fill: color,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {score}%
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// SchemeCard -- specialized card for results page
// ---------------------------------------------------------------------------

export function SchemeCard({
  nameHi,
  nameEn,
  department,
  matchScore,
  annualValue,
  benefitText,
  frequencyText,
  isEligible,
  badgeLabel,
  explanation,
  matchedCriteria,
  missingCriteria,
  documents,
  benefitDescription,
  portalUrl,
  nextAction,
  applyLabel,
  documentsLabel,
  nextStepLabel,
  expanded,
  onExpand,
  lang,
  index,
}: SchemeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const accentColor = isEligible ? 'rgba(19, 136, 8, 0.7)' : 'rgba(217, 119, 6, 0.7)'
  const accentColorSolid = isEligible ? '#138808' : '#D97706'

  // ---- 3D tilt ----
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      setIsHovered(true)
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      setTilt({ x: Math.max(-1, Math.min(1, dy)) * -4, y: Math.max(-1, Math.min(1, dx)) * 4 })
    },
    [],
  )

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  // ---- Stagger delay for entrance animation (CSS-based) ----
  const staggerDelay = `${0.08 + index * 0.1}s`

  const tiltTransform = isHovered
    ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : 'perspective(800px) rotateX(0deg) rotateY(0deg)'

  return (
    <div
      className="scheme-card-entrance"
      style={{
        animationDelay: staggerDelay,
        animationFillMode: 'both',
      }}
    >
      <div
        ref={cardRef}
        className="glass-card glass-card-hover cursor-pointer"
        onClick={onExpand}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          padding: 0,
          transform: tiltTransform,
          transition: isHovered
            ? 'transform 0.12s ease-out'
            : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          overflow: 'hidden',
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(180deg, ${accentColor}, ${accentColor})`,
            borderRadius: '1.25rem 0 0 1.25rem',
          }}
          aria-hidden="true"
        />

        <div style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem' }}>
          {/* ---- Top row: info + score ring ---- */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            {/* Left: name, dept, benefit */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  lineHeight: 1.3,
                  color: '#0F172A',
                  margin: 0,
                }}
              >
                {lang === 'hi' ? nameHi : nameEn}
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginTop: '0.15rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {department}
              </p>
              {/* Smaller English name when in Hindi mode */}
              {lang === 'hi' && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#CBD5E1',
                    marginTop: '0.1rem',
                  }}
                >
                  {nameEn}
                </p>
              )}
            </div>

            {/* Right: progress ring */}
            <ProgressRing score={matchScore} isEligible={isEligible} />
          </div>

          {/* ---- Benefit + badge row ---- */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
            }}
          >
            <div>
              {benefitText && (
                <span
                  className="text-gradient-saffron"
                  style={{ fontSize: '1.15rem', fontWeight: 700 }}
                >
                  {benefitText}
                </span>
              )}
              {frequencyText && (
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '0.35rem' }}>
                  {frequencyText}
                </span>
              )}
            </div>

            <span className={isEligible ? 'badge-3d-eligible' : 'badge-3d-partial'}>
              {badgeLabel}
            </span>
          </div>

          {/* ---- Matched criteria (green checks) ---- */}
          {matchedCriteria.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {matchedCriteria.slice(0, expanded ? undefined : 3).map((c, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    color: '#15803D',
                    background: 'rgba(19, 136, 8, 0.06)',
                    border: '1px solid rgba(19, 136, 8, 0.12)',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.5rem',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8.5L6.5 12L13 4"
                      stroke="#138808"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {c.replace(/_/g, ' ')}
                </span>
              ))}
              {!expanded && matchedCriteria.length > 3 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#94A3B8',
                    padding: '0.15rem 0.4rem',
                  }}
                >
                  +{matchedCriteria.length - 3}
                </span>
              )}
            </div>
          )}

          {/* ---- Missing criteria (amber warnings) ---- */}
          {missingCriteria.length > 0 && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {missingCriteria.slice(0, expanded ? undefined : 2).map((c, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    color: '#A16207',
                    background: 'rgba(234, 179, 8, 0.06)',
                    border: '1px solid rgba(234, 179, 8, 0.12)',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.5rem',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="#D97706" strokeWidth="1.5" fill="none" />
                    <path d="M8 5v3" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.8" fill="#D97706" />
                  </svg>
                  {c.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* ---- Explanation ---- */}
          <p
            style={{
              fontSize: '0.85rem',
              color: '#64748B',
              marginTop: '0.6rem',
              lineHeight: 1.5,
            }}
          >
            {explanation}
          </p>

          {/* ---- Expand/collapse indicator ---- */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0.5rem',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* ---- Expanded details ---- */}
          <div
            style={{
              maxHeight: expanded ? '600px' : '0px',
              opacity: expanded ? 1 : 0,
              overflow: 'hidden',
              transition:
                'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease',
            }}
          >
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Benefit description */}
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.55 }}>
                {benefitDescription}
              </p>

              {/* Annual value highlight */}
              {annualValue != null && annualValue > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(249, 115, 22, 0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(249, 115, 22, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {lang === 'hi' ? 'वार्षिक मूल्य' : 'Annual value'}:
                  </span>
                  <span
                    className="text-gradient-saffron"
                    style={{ fontWeight: 700, fontSize: '1rem' }}
                  >
                    {'\u20B9'}{annualValue.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Documents checklist */}
              {documents.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    {documentsLabel}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {documents.map((doc, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.82rem',
                          color: '#64748B',
                          padding: '0.2rem 0',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#F97316',
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Portal link */}
              {portalUrl && (
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#F97316',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {applyLabel}
                </a>
              )}

              {/* Next best action */}
              {nextAction && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background:
                      'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(124, 58, 237, 0.04))',
                    border: '1px solid rgba(249, 115, 22, 0.15)',
                    borderRadius: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accentColorSolid, marginTop: '0.1rem' }}>
                    {nextStepLabel}:
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {nextAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatCard -- for summary statistics with animated counter
// ---------------------------------------------------------------------------

export function StatCard({
  icon,
  value,
  label,
  prefix = '',
  suffix = '',
  color = 'saffron',
  duration = 1800,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, duration)

  const colorMap: Record<string, string> = {
    saffron: 'rgba(249, 115, 22, 0.12)',
    purple: 'rgba(124, 58, 237, 0.12)',
    success: 'rgba(19, 136, 8, 0.12)',
  }
  const borderMap: Record<string, string> = {
    saffron: 'rgba(249, 115, 22, 0.2)',
    purple: 'rgba(124, 58, 237, 0.2)',
    success: 'rgba(19, 136, 8, 0.2)',
  }

  const gradientClassMap: Record<string, string> = {
    saffron: 'text-gradient-saffron',
    purple: 'text-gradient-brand',
    success: 'text-gradient-success',
  }

  return (
    <GlassCardCompact style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colorMap[color],
          border: `1px solid ${borderMap[color]}`,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.15rem' }}>{label}</p>
        <span
          className={`${gradientClassMap[color]} tabular-nums`}
          style={{ fontSize: '1.35rem', fontWeight: 700 }}
        >
          {prefix}
          {animatedValue.toLocaleString('en-IN')}
          {suffix}
        </span>
      </div>
    </GlassCardCompact>
  )
}

// ---------------------------------------------------------------------------
// Inject keyframe styles at module level (once)
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  const STYLE_ID = 'glasscard-extra-keyframes'
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      @keyframes glasscard-ripple {
        0%   { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(6); opacity: 0; }
      }
      @keyframes schemeCardEntrance {
        0%   { opacity: 0; transform: translateX(40px) scale(0.97); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
      }
      .scheme-card-entrance {
        animation: schemeCardEntrance 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
      }
    `
    document.head.appendChild(style)
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default GlassCard
