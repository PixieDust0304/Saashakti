import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { calculateTotalBenefit } from '../engine/matchSchemes'
import type { BeneficiaryProfile, FieldWorker, SchemeMatch } from '../engine/types'
import {
  CheckCircle,
  AlertCircle,
  IndianRupee,
  FileText,
  ExternalLink,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'

// ─── Props ──────────────────────────────────────────────────
interface Props {
  profile: BeneficiaryProfile | null
  matches: SchemeMatch[]
  fieldWorker: FieldWorker | null
  onRegisterNext: () => void
}

// ─── Helpers ────────────────────────────────────────────────
function formatBenefitAmount(amount: number | null): string {
  if (!amount) return ''
  return `\u20B9${amount.toLocaleString('en-IN')}`
}

const CONFETTI_COLORS = [
  '#F97316', // saffron
  '#7C3AED', // purple
  '#138808', // green
  '#FBBF24', // gold
  '#FB923C', // light saffron
  '#A78BFA', // light purple
  '#34D399', // emerald
  '#FDE68A', // pale gold
]

// ─── Animated Counter Hook ──────────────────────────────────
function useAnimatedCounter(target: number, duration: number = 1800): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    const startTime = performance.now()
    const startValue = 0

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (target - startValue) * eased)
      setValue(current)

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

// ─── Confetti Pieces (generated once) ───────────────────────
interface ConfettiPiece {
  id: number
  left: string
  color: string
  size: number
  duration: string
  delay: string
  rotation: number
}

function generateConfetti(): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < 14; i++) {
    pieces.push({
      id: i,
      left: `${5 + (i * 6.5) % 90}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + (i % 4) * 2,
      duration: `${1.8 + (i % 5) * 0.3}s`,
      delay: `${(i % 7) * 0.12}s`,
      rotation: (i * 47) % 360,
    })
  }
  return pieces
}

// ─── Celebration Confetti Component ─────────────────────────
function CelebrationConfetti() {
  const [visible, setVisible] = useState(true)
  const pieces = useMemo(generateConfetti, [])

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  SCHEME CARD (inline component)
// ═══════════════════════════════════════════════════════════════
interface SchemeCardProps {
  match: SchemeMatch
  lang: string
  t: (k: string) => string
  index: number
}

function SchemeCard({ match, lang, t, index }: SchemeCardProps) {
  const { scheme } = match
  const [expanded, setExpanded] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const isEligible = match.eligibility_status === 'eligible'
  const borderColor = isEligible
    ? 'rgba(19, 136, 8, 0.6)'
    : 'rgba(234, 179, 8, 0.6)'

  const benefitText = formatBenefitAmount(scheme.benefit.amount)

  const freqText =
    scheme.benefit.frequency === 'monthly'
      ? t('per_month')
      : scheme.benefit.frequency === 'annual'
      ? t('per_year')
      : scheme.benefit.frequency === 'one_time' ||
        scheme.benefit.frequency === 'one_time_installments'
      ? t('one_time')
      : ''

  // ── Perspective tilt on hover ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -3, y: dx * 3 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
      style={{
        perspective: '800px',
      }}
    >
      <motion.div
        className="glass-card glass-card-hover cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          borderLeft: `4px solid ${borderColor}`,
          padding: '1.25rem',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── Top row: name + benefit ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight text-white">
              {lang === 'hi' ? scheme.name_hi : scheme.name_en}
            </h3>
            <p className="text-sm text-white/40 mt-0.5 truncate">
              {scheme.department_hi}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {benefitText && (
              <p className="text-lg font-bold text-gradient-saffron">
                {benefitText}
              </p>
            )}
            <p className="text-xs text-white/40">{freqText}</p>
          </div>
        </div>

        {/* ── Badge ── */}
        <div className="mt-3 flex items-center justify-between">
          <span
            className={
              isEligible ? 'badge-3d-eligible' : 'badge-3d-partial'
            }
          >
            {isEligible ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} />
                {t('eligible')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <AlertCircle size={14} />
                {t('partial')}
              </span>
            )}
          </span>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className="text-white/30" />
          </motion.div>
        </div>

        {/* ── Explanation ── */}
        <p className="text-sm text-white/50 mt-2 leading-relaxed">
          {lang === 'hi' ? match.explanation_hi : match.explanation_en}
        </p>

        {/* ── Expanded content ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: 'spring', stiffness: 200, damping: 26 },
                opacity: { duration: 0.25 },
              }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
                {/* Benefit description */}
                <p className="text-sm text-white/60 leading-relaxed">
                  {lang === 'hi'
                    ? scheme.benefit.description_hi
                    : scheme.benefit.description_en}
                </p>

                {/* Document checklist */}
                {scheme.documents_required.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white/70 flex items-center gap-1.5 mb-2">
                      <FileText size={14} className="text-white/50" />
                      {t('documents_needed')}
                    </h4>
                    <ul className="text-sm text-white/50 space-y-1.5">
                      {scheme.documents_required.map(
                        (doc: string, i: number) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#F97316' }}
                            />
                            {doc}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Portal link */}
                {scheme.portal && (
                  <a
                    href={scheme.portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                    style={{ color: '#F97316' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    {t('how_to_apply')}
                  </a>
                )}

                {/* Next best action */}
                {match.next_best_action && (
                  <div
                    className="glass-card flex items-start gap-2.5"
                    style={{
                      padding: '0.75rem 1rem',
                      background:
                        'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(124, 58, 237, 0.06))',
                      borderColor: 'rgba(249, 115, 22, 0.15)',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <ArrowRight
                      size={16}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: '#F97316' }}
                    />
                    <p className="text-sm text-white/70 leading-relaxed">
                      {match.next_best_action}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  RESULTS PAGE (main export)
// ═══════════════════════════════════════════════════════════════
export default function ResultsPage({
  profile,
  matches,
  fieldWorker,
  onRegisterNext,
}: Props) {
  const { t, lang } = useLang()
  const navigate = useNavigate()

  // ── Redirect if no profile ──
  if (!profile) {
    navigate('/')
    return null
  }

  // ── Derived data ──
  const eligible = matches.filter((m) => m.eligibility_status === 'eligible')
  const partial = matches.filter((m) => m.eligibility_status === 'partial')
  const totalBenefit = calculateTotalBenefit(matches)
  const schemeCount = eligible.length + partial.length

  // ── Animated counters ──
  const animatedSchemeCount = useAnimatedCounter(schemeCount, 1400)
  const animatedBenefit = useAnimatedCounter(totalBenefit, 2200)

  // ── Handler ──
  const handleRegisterNext = () => {
    onRegisterNext()
    navigate('/register')
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* ── Celebration confetti on load ── */}
      <CelebrationConfetti />

      {/* ── Page content ── */}
      <div
        className="relative z-10"
        style={{ paddingBottom: fieldWorker ? '6rem' : '2rem' }}
      >
        {/* ════════════════════════════════════════════════
            HERO BENEFIT SUMMARY CARD
            ════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            type: 'spring',
            stiffness: 120,
            damping: 16,
          }}
          className="px-4 pt-6 pb-2"
        >
          <div
            className="glass-card glow-saffron"
            style={{
              padding: '1.5rem',
              background:
                'linear-gradient(135deg, rgba(249, 115, 22, 0.10), rgba(124, 58, 237, 0.10), rgba(255, 255, 255, 0.04))',
              borderColor: 'rgba(249, 115, 22, 0.2)',
            }}
          >
            {/* Sparkle decoration */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-400" />
              <p className="text-sm text-white/50 tracking-wide">
                {profile.name}
              </p>
            </div>

            {/* Giant scheme count */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-6xl font-extrabold counter-glow text-white tabular-nums">
                {animatedSchemeCount}
              </span>
              <span className="text-lg text-white/60 font-medium">
                {lang === 'hi' ? 'योजनाएं मिलीं' : t('schemes_matched')}
              </span>
            </div>

            {/* Benefit amount sub-card */}
            {totalBenefit > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    background:
                      'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.08))',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                  }}
                >
                  <IndianRupee size={22} style={{ color: '#F97316' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40 mb-0.5">
                    {lang === 'hi' ? 'कुल वार्षिक लाभ' : t('total_benefit')}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-gradient-saffron tabular-nums">
                      {`\u20B9${animatedBenefit.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-sm text-white/40">
                      {lang === 'hi' ? '/वर्ष' : '/year'}
                    </span>
                  </div>
                </div>

                <Award size={28} className="text-amber-400/30 flex-shrink-0" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ════════════════════════════════════════════════
            ELIGIBLE SCHEMES SECTION
            ════════════════════════════════════════════════ */}
        {eligible.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="px-4 mt-6 mb-5"
          >
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  background:
                    'linear-gradient(135deg, rgba(19, 136, 8, 0.25), rgba(19, 136, 8, 0.1))',
                  border: '1px solid rgba(19, 136, 8, 0.3)',
                }}
              >
                <CheckCircle size={18} style={{ color: '#6EE7B7' }} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">
                {t('eligible')}
              </h2>
              <span
                className="badge-3d-eligible"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                }}
              >
                {eligible.length}
              </span>
            </div>

            {/* Staggered scheme cards */}
            <div className="space-y-3">
              {eligible.map((m, i) => (
                <SchemeCard
                  key={m.scheme_id}
                  match={m}
                  lang={lang}
                  t={t}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            PARTIAL SCHEMES SECTION
            ════════════════════════════════════════════════ */}
        {partial.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="px-4 mt-2 mb-5"
          >
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 32,
                  height: 32,
                  background:
                    'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(234, 179, 8, 0.1))',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                }}
              >
                <AlertCircle size={18} style={{ color: '#FDE68A' }} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">
                {t('partial')}
              </h2>
              <span
                className="badge-3d-partial"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                }}
              >
                {partial.length}
              </span>
            </div>

            {/* Staggered scheme cards */}
            <div className="space-y-3">
              {partial.map((m, i) => (
                <SchemeCard
                  key={m.scheme_id}
                  match={m}
                  lang={lang}
                  t={t}
                  index={i + eligible.length}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {schemeCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-4 mt-8"
          >
            <div
              className="glass-card text-center"
              style={{ padding: '2.5rem 1.5rem' }}
            >
              <AlertCircle
                size={48}
                className="mx-auto mb-4"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              />
              <p className="text-white/50 text-base">
                {lang === 'hi'
                  ? 'कोई मिलान योजना नहीं मिली।'
                  : 'No matching schemes found.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          FIELD WORKER BOTTOM BAR
          ════════════════════════════════════════════════ */}
      {fieldWorker && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 120, damping: 18 }}
          className="fixed bottom-0 left-0 right-0 z-40"
          style={{
            background: 'rgba(10, 15, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '0.75rem 1rem',
          }}
        >
          <button
            onClick={handleRegisterNext}
            className="btn-3d btn-3d-success"
          >
            <UserPlus size={20} />
            {t('save_register_next')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
