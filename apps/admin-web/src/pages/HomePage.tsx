import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { verifyFieldWorker } from '../lib/supabase'
import type { FieldWorker } from '../engine/types'
import { Shield, User, Globe, ArrowRight, Sparkles, Lock, BarChart3, FileText, AlertTriangle, Target } from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'
import SaashaktiLogo from '../components/ui/SaashaktiLogo'

interface Props {
  onFieldWorkerLogin: (fw: FieldWorker) => void
}

/* ── Animation variants (interactive only) ──────── */

const loginCardVariants = {
  initial: { opacity: 0, y: 60, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 60,
    scale: 0.95,
    transition: { duration: 0.35, ease: [0.55, 0, 1, 0.45] },
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

  const handleBeneficiary = () => {
    navigate('/register')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* ── Animated 3D Background ──────────────────── */}
      <AnimatedBackground />

      {/* ── Language Toggle (top-right) ─────────────── */}
      <button
        onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2.5 rounded-lg
                   bg-white/80 backdrop-blur-xl border border-black/[0.06]
                   text-slate-600 text-sm font-medium
                   hover:bg-white/90 hover:border-black/[0.12]
                   active:scale-95 transition-all duration-200 cursor-pointer select-none
                   animate-fade-in"
        style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
      >
        <Globe size={16} className="opacity-70" />
        {lang === 'hi' ? 'English' : 'हिंदी'}
      </button>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16 relative z-10">
        <div className="w-full max-w-[420px] flex flex-col items-center">

          {/* ── Logo with Glow Ring ───────────────────── */}
          <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="animate-float">
              <SaashaktiLogo size={96} glow />
              <Sparkles
                size={14}
                className="absolute -top-1 -right-1 text-saffron-500 opacity-80"
              />
            </div>
          </div>

          {/* ── Title & Tagline ───────────────────────── */}
          <h1
            className="text-3xl font-bold text-slate-900 text-glow-saffron mb-1 select-none animate-slide-up"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            {t('app_name')}
          </h1>
          <p
            className="text-saffron-500 text-lg mb-10 select-none animate-slide-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            {t('app_tagline')}
          </p>

          {/* ── Action Buttons / Login Card ───────────── */}
          <AnimatePresence mode="wait">
            {!showLogin ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
                className="w-full space-y-4"
              >
                {/* Field Worker Button */}
                <div className="animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 0 30px rgba(249, 115, 22, 0.25), 0 12px 40px rgba(0, 0, 0, 0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowLogin(true)}
                    className="glass-card glass-card-hover w-full py-5 px-6 flex items-center
                               cursor-pointer select-none
                               border-[rgba(249,115,22,0.20)]
                               hover:border-[rgba(249,115,22,0.35)]
                               transition-all duration-300"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.02))',
                      borderColor: 'rgba(249, 115, 22, 0.25)',
                    }}
                  >
                    <Shield size={22} className="text-saffron-400 shrink-0" />
                    <span className="flex-1 text-center text-slate-800 font-semibold text-lg">
                      {t('i_am_field_worker')}
                    </span>
                    <ArrowRight size={20} className="text-slate-400 shrink-0" />
                  </motion.button>
                </div>

                {/* Beneficiary Button */}
                <div className="animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 0 30px rgba(124, 58, 237, 0.25), 0 12px 40px rgba(0, 0, 0, 0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBeneficiary}
                    className="glass-card glass-card-hover w-full py-5 px-6 flex items-center
                               cursor-pointer select-none
                               transition-all duration-300"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(124, 58, 237, 0.02))',
                      borderColor: 'rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    <User size={22} className="text-purple-400 shrink-0" />
                    <span className="flex-1 text-center text-slate-800 font-semibold text-lg">
                      {t('i_am_beneficiary')}
                    </span>
                    <ArrowRight size={20} className="text-slate-400 shrink-0" />
                  </motion.button>
                </div>

                {/* Admin tools strip — compact grid so the primary */}
                {/* actions stay the visual anchor. Each tile routes */}
                {/* to one of the operations screens migration 002    */}
                {/* lit up (dashboard, follow-up, grievances, coverage) */}
                <div
                  className="pt-3 animate-slide-up"
                  style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {lang === 'hi' ? 'प्रशासन' : 'Admin tools'}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <NavTile
                      to="/dashboard"
                      icon={<BarChart3 size={18} />}
                      label={lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                      accent="saffron"
                    />
                    <NavTile
                      to="/follow-up"
                      icon={<FileText size={18} />}
                      label={lang === 'hi' ? 'ट्रैकिंग' : 'Follow-up'}
                      accent="saffron"
                    />
                    <NavTile
                      to="/grievances"
                      icon={<AlertTriangle size={18} />}
                      label={lang === 'hi' ? 'शिकायत' : 'Grievances'}
                      accent="saffron"
                    />
                    <NavTile
                      to="/coverage"
                      icon={<Target size={18} />}
                      label={lang === 'hi' ? 'कवरेज' : 'Coverage'}
                      accent="saffron"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── Field Worker Login Card ─────────────── */
              <motion.div
                key="login"
                variants={loginCardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full glass-card p-6"
              >
                {/* Lock icon header */}
                <div className="flex flex-col items-center mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(124, 58, 237, 0.10))',
                      border: '1px solid rgba(249, 115, 22, 0.20)',
                    }}
                  >
                    <Lock size={22} className="text-saffron-400" />
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
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center mb-3"
                  >
                    {error}
                  </motion.p>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <div
        className="text-center pb-6 text-xs text-slate-400 relative z-10 select-none animate-fade-in"
        style={{ animationDelay: '0.8s', animationFillMode: 'both' }}
      >
        महिला एवं बाल विकास विभाग, छत्तीसगढ़
      </div>
    </div>
  )
}

/* ── Compact admin-tool tile ─────────────────────── */
function NavTile({
  to, icon, label, accent,
}: {
  to: string
  icon: React.ReactNode
  label: string
  accent: 'saffron' | 'purple'
}) {
  const navigate = useNavigate()
  const tint = accent === 'saffron'
    ? 'rgba(249, 115, 22, 0.12)'
    : 'rgba(124, 58, 237, 0.12)'
  const border = accent === 'saffron'
    ? 'rgba(249, 115, 22, 0.28)'
    : 'rgba(124, 58, 237, 0.28)'
  const iconColor = accent === 'saffron' ? 'text-saffron-500' : 'text-purple-400'
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl
                 bg-white/60 backdrop-blur-sm border transition-all duration-200
                 hover:bg-white/80 cursor-pointer select-none"
      style={{
        borderColor: border,
        background: `linear-gradient(135deg, ${tint}, rgba(255,255,255,0.5))`,
      }}
    >
      <span className={iconColor}>{icon}</span>
      <span className="text-[11px] font-semibold text-slate-700 leading-tight">{label}</span>
    </motion.button>
  )
}
