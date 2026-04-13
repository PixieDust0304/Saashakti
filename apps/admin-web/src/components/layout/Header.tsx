import { motion } from 'framer-motion'
import { useLang } from '../../hooks/useLang'
import type { FieldWorker } from '../../engine/types'
import { Globe } from 'lucide-react'

interface Props {
  fieldWorker?: FieldWorker | null
}

export default function Header({ fieldWorker }: Props) {
  const { lang, setLang, t } = useLang()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-header sticky top-0 z-50 px-4 flex items-center justify-between"
      style={{ height: 60 }}
    >
      {/* Left: Logo + App Name + Field Worker Info */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #a855f7)',
          }}
        >
          <span className="text-white font-bold text-sm leading-none">स</span>
        </div>
        <div className="flex flex-col">
          <span className="text-saffron-400 font-bold text-lg leading-tight">
            {t('app_name')}
          </span>
          {fieldWorker && (
            <span className="text-xs text-white/40 leading-tight">
              {fieldWorker.name} — {fieldWorker.organization}
            </span>
          )}
        </div>
      </div>

      {/* Right: Language Toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                   bg-white/[0.07] border border-white/[0.1] text-white/80
                   active:bg-white/[0.12] transition-colors"
      >
        <Globe size={14} className="opacity-70" />
        {lang === 'hi' ? 'EN' : 'हि'}
      </motion.button>
    </motion.header>
  )
}
