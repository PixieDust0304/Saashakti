import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { verifyFieldWorker } from '../lib/supabase'
import type { FieldWorker } from '../engine/types'
import { Shield, User, Globe, ArrowRight, Sparkles, Lock } from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'

interface Props {
  onFieldWorkerLogin: (fw: FieldWorker) => void
}

/* ── Animation variants ─────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const childFadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

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

const logoFloat = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
}

const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 30px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.1)',
      '0 0 50px rgba(249, 115, 22, 0.35), 0 0 100px rgba(249, 115, 22, 0.15)',
      '0 0 30px rgba(249, 115, 22, 0.2), 0 0 60px rgba(249, 115, 22, 0.1)',
    ],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
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
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2.5 rounded-lg
                   bg-white/[0.06] backdrop-blur-xl border border-white/[0.12]
                   text-white/80 text-sm font-medium
                   hover:bg-white/[0.10] hover:border-white/[0.20]
                   active:scale-95 transition-all duration-200 cursor-pointer select-none"
      >
        <Globe size={16} className="opacity-70" />
        {lang === 'hi' ? 'English' : 'हिंदी'}
      </motion.button>

      {/* ── Main Content ────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16 relative z-10"
      >
        <div className="w-full max-w-[420px] flex flex-col items-center">

          {/* ── Logo with Glow Ring ───────────────────── */}
          <motion.div variants={childFadeUp} className="relative mb-6">
            {/* Pulsing saffron glow ring behind the logo */}
            <motion.div
              {...glowPulse}
              className="absolute inset-0 rounded-2xl"
              style={{ margin: '-8px' }}
            />
            {/* Floating logo card */}
            <motion.div
              {...logoFloat}
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #F97316, #7C3AED)',
                boxShadow:
                  '0 8px 32px rgba(249, 115, 22, 0.3), 0 4px 0 rgba(0, 0, 0, 0.15)',
              }}
            >
              <span className="text-white font-bold text-[32px] leading-none select-none">
                स
              </span>
              {/* Sparkle accent */}
              <Sparkles
                size={14}
                className="absolute -top-1 -right-1 text-saffron-300 opacity-80"
              />
            </motion.div>
          </motion.div>

          {/* ── Title & Tagline ───────────────────────── */}
          <motion.h1
            variants={childFadeUp}
            className="text-3xl font-bold text-white text-glow-saffron mb-1 select-none"
          >
            {t('app_name')}
          </motion.h1>
          <motion.p
            variants={childFadeUp}
            className="text-saffron-300 text-lg mb-10 select-none"
          >
            {t('app_tagline')}
          </motion.p>

          {/* ── Action Buttons / Login Card ───────────── */}
          <AnimatePresence mode="wait">
            {!showLogin ? (
              <motion.div
                key="buttons"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
                className="w-full space-y-4"
              >
                {/* Field Worker Button */}
                <motion.div variants={buttonVariants}>
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
                        'linear-gradient(135deg, rgba(249, 115, 22, 0.10), rgba(249, 115, 22, 0.03))',
                      borderColor: 'rgba(249, 115, 22, 0.20)',
                    }}
                  >
                    <Shield size={22} className="text-saffron-400 shrink-0" />
                    <span className="flex-1 text-center text-white font-semibold text-lg">
                      {t('i_am_field_worker')}
                    </span>
                    <ArrowRight size={20} className="text-white/40 shrink-0" />
                  </motion.button>
                </motion.div>

                {/* Beneficiary Button */}
                <motion.div variants={buttonVariants}>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: '0 0 30px rgba(124, 58, 237, 0.25), 0 12px 40px rgba(0, 0, 0, 0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBeneficiary}
                    className="glass-card glass-card-hover w-full py-5 px-6 flex items-center
                               cursor-pointer select-none
                               transition-all duration-300"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(124, 58, 237, 0.10), rgba(124, 58, 237, 0.03))',
                      borderColor: 'rgba(124, 58, 237, 0.20)',
                    }}
                  >
                    <User size={22} className="text-purple-400 shrink-0" />
                    <span className="flex-1 text-center text-white font-semibold text-lg">
                      {t('i_am_beneficiary')}
                    </span>
                    <ArrowRight size={20} className="text-white/40 shrink-0" />
                  </motion.button>
                </motion.div>
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
                  <h2 className="text-white font-semibold text-lg">
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
                  className="w-full text-center text-white/50 hover:text-white/80
                             py-2 text-sm transition-colors duration-200 cursor-pointer select-none"
                >
                  {t('back')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Footer ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-center pb-6 text-xs text-white/25 relative z-10 select-none"
      >
        महिला एवं बाल विकास विभाग, छत्तीसगढ़
      </motion.div>
    </div>
  )
}
