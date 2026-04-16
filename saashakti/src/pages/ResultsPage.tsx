import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { calculateTotalBenefit } from '../engine/matchSchemes'
import type { BeneficiaryProfile, FieldWorker, SchemeMatch } from '../engine/types'
import GlassCard, {
  SchemeCard,
  StatCard,
  useAnimatedCounter,
} from '../components/ui/GlassCard'
import AnimatedBackground from '../components/3d/AnimatedBackground'

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface Props {
  profile: BeneficiaryProfile | null
  matches: SchemeMatch[]
  fieldWorker: FieldWorker | null
  onRegisterNext: () => void
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatBenefitAmount(amount: number | null): string {
  if (!amount) return ''
  return `\u20B9${amount.toLocaleString('en-IN')}`
}

// ----------------------------------------------------------------
// Confetti
// ----------------------------------------------------------------
const CONFETTI_COLORS = [
  '#ED7023', // saffron brand
  '#764F90', // purple brand
  '#138808', // green brand
  '#FBBF24', // gold
  '#FB923C', // light saffron
  '#A78BFA', // light purple
  '#34D399', // emerald
  '#FDE68A', // pale gold
]

interface ConfettiPiece {
  id: number
  left: string
  color: string
  size: number
  duration: string
  delay: string
  rotation: number
  shape: 'circle' | 'rect' | 'diamond'
}

function generateConfetti(): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = []
  const shapes: Array<'circle' | 'rect' | 'diamond'> = ['circle', 'rect', 'diamond']
  for (let i = 0; i < 24; i++) {
    pieces.push({
      id: i,
      left: `${3 + ((i * 4.1) % 94)}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + (i % 5) * 2,
      duration: `${2.0 + (i % 6) * 0.25}s`,
      delay: `${(i % 9) * 0.1}s`,
      rotation: (i * 41) % 360,
      shape: shapes[i % 3],
    })
  }
  return pieces
}

function CelebrationConfetti() {
  const [visible, setVisible] = useState(true)
  const pieces = useMemo(generateConfetti, [])

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p) => {
        const shapeStyle: React.CSSProperties =
          p.shape === 'circle'
            ? { borderRadius: '50%' }
            : p.shape === 'diamond'
            ? { borderRadius: '2px', transform: `rotate(${p.rotation + 45}deg)` }
            : { borderRadius: '2px', transform: `rotate(${p.rotation}deg)` }

        return (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: p.left,
              top: '-20px',
              width: p.size,
              height: p.size * 1.3,
              backgroundColor: p.color,
              animationDuration: p.duration,
              animationDelay: p.delay,
              ...shapeStyle,
            }}
          />
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------
// Section Header
// ----------------------------------------------------------------
function SectionHeader({
  icon,
  title,
  count,
  color,
  delay,
}: {
  icon: React.ReactNode
  title: string
  count: number
  color: 'green' | 'amber'
  delay: string
}) {
  const bg =
    color === 'green'
      ? 'linear-gradient(135deg, rgba(19, 136, 8, 0.18), rgba(19, 136, 8, 0.06))'
      : 'linear-gradient(135deg, rgba(234, 179, 8, 0.18), rgba(234, 179, 8, 0.06))'
  const border =
    color === 'green'
      ? '1px solid rgba(19, 136, 8, 0.25)'
      : '1px solid rgba(234, 179, 8, 0.25)'
  const glowShadow =
    color === 'green'
      ? '0 0 16px rgba(19, 136, 8, 0.1)'
      : '0 0 16px rgba(234, 179, 8, 0.1)'

  return (
    <div
      className="section-header-entrance"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        marginBottom: '1rem',
        animationDelay: delay,
        animationFillMode: 'both',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          border,
          boxShadow: glowShadow,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h2 style={{ fontSize: '1.12rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>
        {title}
      </h2>
      <span
        className={color === 'green' ? 'badge-3d-eligible' : 'badge-3d-partial'}
        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
      >
        {count}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------
// Print / Share button
// ----------------------------------------------------------------
function PrintShareButton({ lang }: { lang: string }) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === 'hi' ? 'सशक्ति - योजना परिणाम' : 'Saashakti - Scheme Results',
          text:
            lang === 'hi'
              ? 'मेरी पात्र सरकारी योजनाएं देखें'
              : 'Check my eligible government schemes',
          url: window.location.href,
        })
      } catch {
        // user cancelled
      }
    } else {
      handlePrint()
    }
  }, [lang, handlePrint])

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.82rem',
        fontWeight: 500,
        color: '#64748B',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '0.75rem',
        padding: '0.5rem 0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      aria-label={lang === 'hi' ? 'प्रिंट या शेयर करें' : 'Print or share'}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {lang === 'hi' ? 'शेयर / प्रिंट' : 'Share / Print'}
    </button>
  )
}

// ================================================================
// RESULTS PAGE (main export)
// ================================================================
export default function ResultsPage({
  profile,
  matches,
  fieldWorker,
  onRegisterNext,
}: Props) {
  const { t, lang } = useLang()
  const navigate = useNavigate()

  // ---- Expanded card state ----
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ---- Redirect if no profile ----
  if (!profile) {
    navigate('/')
    return null
  }

  // ---- Derived data ----
  const eligible = matches.filter((m) => m.eligibility_status === 'eligible')
  const partial = matches.filter((m) => m.eligibility_status === 'partial')
  const totalBenefit = calculateTotalBenefit(matches)
  const schemeCount = eligible.length + partial.length

  // ---- Animated counters ----
  const animatedSchemeCount = useAnimatedCounter(schemeCount, 1400)
  const animatedBenefit = useAnimatedCounter(totalBenefit, 2200)

  // ---- Handlers ----
  const handleRegisterNext = () => {
    onRegisterNext()
    navigate('/register')
  }

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  // ---- Frequency text helper ----
  function getFreqText(freq: string): string {
    if (freq === 'monthly') return t('per_month')
    if (freq === 'annual') return t('per_year')
    if (freq === 'one_time' || freq === 'one_time_installments') return t('one_time')
    return ''
  }

  return (
    <div className="relative min-h-screen page-enter">
      <AnimatedBackground />

      {/* ---- Confetti on load ---- */}
      {schemeCount > 0 && <CelebrationConfetti />}

      {/* ---- Page content ---- */}
      <div
        className="relative z-10"
        style={{ paddingBottom: fieldWorker ? '6rem' : '2rem' }}
      >
        {/* ============================================================
            HERO SUMMARY CARD
            ============================================================ */}
        <div
          className="summary-entrance"
          style={{
            padding: '1.5rem 1rem 0.5rem',
            animationFillMode: 'both',
          }}
        >
          <GlassCard
            variant="saffron"
            glow
            tilt
            style={{
              padding: '1.5rem',
              background:
                'linear-gradient(135deg, rgba(237, 112, 35, 0.08), rgba(118, 79, 144, 0.06), rgba(255, 255, 255, 0.80))',
              borderColor: 'rgba(237, 112, 35, 0.2)',
            }}
          >
            {/* Sparkle + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
              </svg>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8', letterSpacing: '0.02em' }}>
                {profile.name}
              </p>

              {/* Print/Share button -- top right */}
              <div style={{ marginLeft: 'auto' }}>
                <PrintShareButton lang={lang} />
              </div>
            </div>

            {/* Giant scheme count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
              <span
                className="counter-glow tabular-nums"
                style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}
              >
                {animatedSchemeCount}
              </span>
              <span style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 500 }}>
                {lang === 'hi' ? 'योजनाएं मिलीं' : t('schemes_matched')}
              </span>
            </div>

            {/* Total benefit sub-card */}
            {totalBenefit > 0 && (
              <StatCard
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                }
                value={totalBenefit}
                label={lang === 'hi' ? 'कुल वार्षिक लाभ' : t('total_benefit')}
                prefix={'\u20B9'}
                suffix={lang === 'hi' ? '/वर्ष' : '/year'}
                color="saffron"
                duration={2200}
              />
            )}
          </GlassCard>
        </div>

        {/* ============================================================
            ELIGIBLE SCHEMES SECTION
            ============================================================ */}
        {eligible.length > 0 && (
          <div style={{ padding: '0 1rem', marginTop: '1.75rem' }}>
            <SectionHeader
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              title={lang === 'hi' ? 'पात्र योजनाएं' : t('eligible')}
              count={eligible.length}
              color="green"
              delay="0.3s"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {eligible.map((m, i) => (
                <SchemeCard
                  key={m.scheme_id}
                  nameHi={m.scheme.name_hi}
                  nameEn={m.scheme.name_en}
                  department={m.scheme.department_hi}
                  matchScore={m.match_score}
                  annualValue={m.scheme.benefit.annual_value}
                  benefitText={formatBenefitAmount(m.scheme.benefit.amount)}
                  frequencyText={getFreqText(m.scheme.benefit.frequency)}
                  isEligible={true}
                  badgeLabel={
                    lang === 'hi'
                      ? `\u2713 ${t('eligible')}`
                      : t('eligible')
                  }
                  explanation={lang === 'hi' ? m.explanation_hi : m.explanation_en}
                  matchedCriteria={m.matched_criteria}
                  missingCriteria={m.missing_criteria}
                  documents={m.scheme.documents_required}
                  benefitDescription={
                    lang === 'hi'
                      ? m.scheme.benefit.description_hi
                      : m.scheme.benefit.description_en
                  }
                  portalUrl={m.scheme.portal || undefined}
                  nextAction={m.next_best_action || undefined}
                  applyLabel={t('how_to_apply')}
                  documentsLabel={t('documents_needed')}
                  nextStepLabel={lang === 'hi' ? 'अगला कदम' : 'Next step'}
                  expanded={expandedId === m.scheme_id}
                  onExpand={() => toggleExpand(m.scheme_id)}
                  lang={lang}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            PARTIAL SCHEMES SECTION
            ============================================================ */}
        {partial.length > 0 && (
          <div style={{ padding: '0 1rem', marginTop: '1.75rem' }}>
            <SectionHeader
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              title={lang === 'hi' ? 'आंशिक पात्र' : t('partial')}
              count={partial.length}
              color="amber"
              delay="0.5s"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {partial.map((m, i) => (
                <SchemeCard
                  key={m.scheme_id}
                  nameHi={m.scheme.name_hi}
                  nameEn={m.scheme.name_en}
                  department={m.scheme.department_hi}
                  matchScore={m.match_score}
                  annualValue={m.scheme.benefit.annual_value}
                  benefitText={formatBenefitAmount(m.scheme.benefit.amount)}
                  frequencyText={getFreqText(m.scheme.benefit.frequency)}
                  isEligible={false}
                  badgeLabel={
                    lang === 'hi'
                      ? `\u26A0 ${t('partial')}`
                      : t('partial')
                  }
                  explanation={lang === 'hi' ? m.explanation_hi : m.explanation_en}
                  matchedCriteria={m.matched_criteria}
                  missingCriteria={m.missing_criteria}
                  documents={m.scheme.documents_required}
                  benefitDescription={
                    lang === 'hi'
                      ? m.scheme.benefit.description_hi
                      : m.scheme.benefit.description_en
                  }
                  portalUrl={m.scheme.portal || undefined}
                  nextAction={m.next_best_action || undefined}
                  applyLabel={t('how_to_apply')}
                  documentsLabel={t('documents_needed')}
                  nextStepLabel={lang === 'hi' ? 'अगला कदम' : 'Next step'}
                  expanded={expandedId === m.scheme_id}
                  onExpand={() => toggleExpand(m.scheme_id)}
                  lang={lang}
                  index={i + eligible.length}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            EMPTY STATE
            ============================================================ */}
        {schemeCount === 0 && (
          <div
            className="empty-state-entrance"
            style={{
              padding: '0 1rem',
              marginTop: '2rem',
              animationFillMode: 'both',
            }}
          >
            <GlassCard
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
              }}
            >
              {/* Illustration: stylized empty state */}
              <div
                style={{
                  margin: '0 auto 1.25rem',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(237,112,35,0.08), rgba(118,79,144,0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>

              <p style={{ fontSize: '1rem', color: '#64748B', marginBottom: '0.5rem' }}>
                {lang === 'hi'
                  ? 'कोई मिलान योजना नहीं मिली।'
                  : 'No matching schemes found.'}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5 }}>
                {lang === 'hi'
                  ? 'चिंता न करें! अपनी जानकारी दोबारा जांचें या स्थानीय आंगनवाड़ी से संपर्क करें।'
                  : "Don't worry! Double-check your information or contact your local Anganwadi center for guidance."}
              </p>

              <button
                onClick={() => navigate('/intake')}
                className="btn-3d btn-3d-primary"
                style={{ marginTop: '1.25rem', maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}
              >
                {lang === 'hi' ? 'फिर से जांचें' : 'Check Again'}
              </button>
            </GlassCard>
          </div>
        )}

        {/* ============================================================
            BOTTOM CTA BUTTONS
            ============================================================ */}
        {schemeCount > 0 && (
          <div
            className="cta-entrance"
            style={{
              padding: '1.5rem 1rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animationDelay: '0.6s',
              animationFillMode: 'both',
            }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-3d btn-3d-primary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {lang === 'hi' ? 'डैशबोर्ड देखें' : 'View Dashboard'}
            </button>

            <button
              onClick={() => navigate('/intake')}
              className="btn-3d btn-3d-secondary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {lang === 'hi' ? 'फिर से जांचें' : 'Check Again'}
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          FIELD WORKER BOTTOM BAR
          ============================================================ */}
      {fieldWorker && (
        <div
          className="fieldworker-bar-entrance"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '0.75rem 1rem',
            animationFillMode: 'both',
          }}
        >
          <button
            onClick={handleRegisterNext}
            className="btn-3d btn-3d-success"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {t('save_register_next')}
          </button>
        </div>
      )}
    </div>
  )
}
