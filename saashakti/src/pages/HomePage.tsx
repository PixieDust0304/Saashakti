import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { verifyFieldWorker } from '../lib/supabase'
import type { FieldWorker } from '../engine/types'
import AnimatedBackground from '../components/3d/AnimatedBackground'
import SaashaktiLogo from '../components/ui/SaashaktiLogo'

interface Props {
  onFieldWorkerLogin: (fw: FieldWorker) => void
}

/* ── Feature card data ─────────────────────────── */
const FEATURES = [
  {
    iconPath:
      'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    titleHi: 'आधार सत्यापन',
    titleEn: 'Aadhaar Verification',
    descHi: 'सुरक्षित पहचान सत्यापन से सुनिश्चित करें कि हर लाभ सही व्यक्ति तक पहुँचे।',
    descEn: 'Secure identity verification ensures every benefit reaches the right person.',
    accent: 'saffron',
  },
  {
    iconPath:
      'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    titleHi: 'योजना मिलान',
    titleEn: 'Scheme Matching',
    descHi: 'AI-संचालित इंजन 21+ सरकारी योजनाओं से आपकी पात्रता का मिलान करता है।',
    descEn: 'AI-powered engine matches your eligibility across 21+ government schemes.',
    accent: 'purple',
  },
  {
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    titleHi: 'लाभ ट्रैकिंग',
    titleEn: 'Benefit Tracking',
    descHi: 'अपने लाभों को ट्रैक करें और देखें कि आपको कितना मिल सकता है।',
    descEn: 'Track your benefits and see how much you can receive annually.',
    accent: 'green',
  },
]

/* ── Stats data ────────────────────────────────── */
const STATS = [
  { valueHi: '21+', valueEn: '21+', labelHi: 'योजनाएं', labelEn: 'Schemes' },
  { valueHi: '27', valueEn: '27', labelHi: 'जिले', labelEn: 'Districts' },
  { valueHi: '₹2L+', valueEn: '₹2L+', labelHi: 'लाभ', labelEn: 'Benefits' },
]

/* ── Accent color maps ─────────────────────────── */
const ACCENT_STYLES: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
  saffron: {
    bg: 'linear-gradient(135deg, rgba(237,112,35,0.08), rgba(237,112,35,0.02))',
    border: 'rgba(237,112,35,0.20)',
    icon: '#ED7023',
    glow: 'rgba(237,112,35,0.15)',
  },
  purple: {
    bg: 'linear-gradient(135deg, rgba(118,79,144,0.08), rgba(118,79,144,0.02))',
    border: 'rgba(118,79,144,0.20)',
    icon: '#764F90',
    glow: 'rgba(118,79,144,0.15)',
  },
  green: {
    bg: 'linear-gradient(135deg, rgba(19,136,8,0.08), rgba(19,136,8,0.02))',
    border: 'rgba(19,136,8,0.20)',
    icon: '#138808',
    glow: 'rgba(19,136,8,0.15)',
  },
}

/* ── Component ──────────────────────────────────── */

export default function HomePage({ onFieldWorkerLogin }: Props) {
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isHi = lang === 'hi'

  const handleWorkerLogin = async () => {
    if (code.length < 4) return
    setLoading(true)
    setError('')
    try {
      const worker = await verifyFieldWorker(code)
      if (worker) {
        onFieldWorkerLogin(worker as FieldWorker)
        navigate('/register')
      } else {
        setError(t('invalid_code'))
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  const handleStart = () => {
    navigate('/register')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* ── Animated 3D Background ──────────────────── */}
      <AnimatedBackground />

      {/* ── Language Toggle (top-right, floating) ───── */}
      <div
        className="fixed top-4 right-4 z-50 animate-stagger-1"
      >
        <button
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          className="relative flex items-center rounded-full text-sm font-semibold
                     bg-white/80 backdrop-blur-xl border border-black/[0.06] overflow-hidden
                     hover:bg-white/90 hover:border-black/[0.12]
                     active:scale-95 transition-all duration-200 cursor-pointer select-none"
          style={{ height: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        >
          <span
            className={`px-3 py-1 transition-all duration-200 ${
              isHi ? 'text-white' : 'text-slate-500'
            }`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            हिं
          </span>
          <span
            className={`px-3 py-1 transition-all duration-200 ${
              !isHi ? 'text-white' : 'text-slate-500'
            }`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            En
          </span>
          <span
            className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: '50%',
              left: isHi ? '2px' : 'calc(50% - 2px)',
              background: 'linear-gradient(135deg, #ED7023, #764F90)',
              boxShadow: '0 2px 8px rgba(237,112,35,0.3)',
              zIndex: 0,
            }}
          />
        </button>
      </div>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center relative z-10">

        {/* ── Hero Section ──────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-10 flex flex-col items-center text-center">

          {/* Logo with entrance animation */}
          <div
            className="relative mb-6 animate-stagger-1"
          >
            <div className="animate-float">
              <SaashaktiLogo size={120} showText glow />
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-gradient-brand text-glow-saffron mb-3 select-none animate-stagger-2"
          >
            {t('app_name')}
          </h1>

          {/* Subtitle / Tagline */}
          <p
            className="text-lg sm:text-xl text-slate-600 max-w-md mb-4 select-none animate-stagger-3"
            style={{ lineHeight: 1.6 }}
          >
            {t('app_tagline')}
          </p>

          {/* English subtext when in Hindi mode */}
          {isHi && (
            <p
              className="text-sm text-slate-400 mb-8 select-none animate-stagger-3"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}
            >
              Every woman deserves her rights
            </p>
          )}
          {!isHi && (
            <p
              className="text-sm text-slate-400 mb-8 select-none animate-stagger-3"
              style={{ letterSpacing: '0.02em' }}
            >
              हर महिला को उसका हक़
            </p>
          )}

          {/* ── CTA Button ──────────────────────────── */}
          <div className="animate-stagger-4 w-full max-w-xs mb-14">
            <button
              onClick={handleStart}
              className="btn-3d btn-3d-primary text-xl group"
            >
              <span>{isHi ? 'अभी शुरू करें' : 'Start Now'}</span>
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </section>

        {/* ── Feature Cards ─────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-12">
          <div className="perspective-container">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => {
                const a = ACCENT_STYLES[f.accent];
                return (
                  <div
                    key={i}
                    className={`tilt-card glass-card glass-card-hover p-6 flex flex-col items-center text-center animate-stagger-${i + 1}`}
                    style={{
                      background: a.bg,
                      borderColor: a.border,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${a.glow}, transparent)`,
                        border: `1px solid ${a.border}`,
                      }}
                    >
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={a.icon}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={f.iconPath} />
                      </svg>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-slate-800 mb-2">
                      {isHi ? f.titleHi : f.titleEn}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {isHi ? f.descHi : f.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Stats Row ─────────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-10">
          <div className="grid grid-cols-3 gap-4 animate-stagger-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="glass-card p-4 sm:p-5 text-center"
              >
                <div
                  className="text-2xl sm:text-3xl font-bold mb-1 text-gradient-saffron counter-glow"
                >
                  {isHi ? s.valueHi : s.valueEn}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isHi ? s.labelHi : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Role Selection / Login ────────────────── */}
        <section className="w-full max-w-md mx-auto px-6 pb-10 animate-stagger-5">
          {!showLogin ? (
            <div className="space-y-4">
              {/* Field Worker Button */}
              <button
                onClick={() => setShowLogin(true)}
                className="glass-card glass-card-hover w-full py-5 px-6 flex items-center
                           cursor-pointer select-none transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(237,112,35,0.08), rgba(237,112,35,0.02))',
                  borderColor: 'rgba(237,112,35,0.25)',
                }}
              >
                <svg className="w-6 h-6 text-saffron-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="flex-1 text-center text-slate-800 font-semibold text-lg">
                  {t('i_am_field_worker')}
                </span>
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Beneficiary Button */}
              <button
                onClick={handleStart}
                className="glass-card glass-card-hover w-full py-5 px-6 flex items-center
                           cursor-pointer select-none transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(118,79,144,0.08), rgba(118,79,144,0.02))',
                  borderColor: 'rgba(118,79,144,0.25)',
                }}
              >
                <svg className="w-6 h-6 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="flex-1 text-center text-slate-800 font-semibold text-lg">
                  {t('i_am_beneficiary')}
                </span>
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            /* ── Field Worker Login Card ─────────────── */
            <div
              className="w-full glass-card p-6 page-enter"
            >
              {/* Lock icon header */}
              <div className="flex flex-col items-center mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(237,112,35,0.15), rgba(118,79,144,0.10))',
                    border: '1px solid rgba(237,112,35,0.20)',
                  }}
                >
                  <svg className="w-6 h-6 text-saffron-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-slate-900 font-semibold text-lg">
                  {t('enter_access_code')}
                </h2>
              </div>

              {/* Code Input */}
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setError('')
                }}
                className="input-3d text-center text-2xl tracking-[0.3em] font-mono mb-4"
                placeholder="------"
                maxLength={6}
                autoFocus
              />

              {/* Error message */}
              {error && (
                <p
                  className="text-red-400 text-sm text-center mb-3 animate-fade-in"
                >
                  {error}
                </p>
              )}

              {/* Verify button */}
              <button
                onClick={handleWorkerLogin}
                disabled={code.length < 4 || loading}
                className="btn-3d btn-3d-primary mb-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                    {t('loading')}
                  </span>
                ) : (
                  t('verify')
                )}
              </button>

              {/* Back button */}
              <button
                onClick={() => {
                  setShowLogin(false)
                  setCode('')
                  setError('')
                }}
                className="w-full text-center text-slate-400 hover:text-slate-600
                           py-2 text-sm transition-colors duration-200 cursor-pointer select-none"
              >
                {t('back')}
              </button>
            </div>
          )}
        </section>

        {/* ── Trust Badges ──────────────────────────── */}
        <section className="w-full max-w-md mx-auto px-6 pb-6 animate-stagger-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="trust-badge">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {isHi ? 'भारत सरकार' : 'Govt. of India'}
            </span>
            <span className="trust-badge">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Digital India
            </span>
            <span className="trust-badge">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isHi ? 'छत्तीसगढ़' : 'Chhattisgarh'}
            </span>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <div
          className="text-center pb-8 text-xs text-slate-400 relative z-10 select-none animate-stagger-6"
        >
          {isHi
            ? 'महिला एवं बाल विकास विभाग, छत्तीसगढ़'
            : 'Women & Child Development Dept., Chhattisgarh'}
        </div>
      </div>
    </div>
  )
}
