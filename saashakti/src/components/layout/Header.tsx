import { useEffect, useState } from 'react'
import { useLang } from '../../hooks/useLang'
import type { FieldWorker } from '../../engine/types'
import { SaashaktiLogoMark } from '../ui/SaashaktiLogo'

interface Props {
  fieldWorker?: FieldWorker | null
}

export default function Header({ fieldWorker }: Props) {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`glass-header sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between transition-all duration-300 ${
        scrolled ? 'glass-header-scrolled' : ''
      }`}
      style={{
        height: 60,
        animation: 'headerSlideDown 0.4s ease-out both',
      }}
    >
      {/* Left: Logo + Brand + Field Worker Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <SaashaktiLogoMark size={40} className="relative z-10" />
          {/* Subtle glow behind logo */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(237,112,35,0.25), transparent 70%)',
              filter: 'blur(8px)',
              transform: 'scale(1.5)',
              zIndex: 0,
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-gradient-brand font-bold text-lg leading-tight select-none">
            {t('app_name')}
          </span>
          {fieldWorker && (
            <span className="text-xs text-slate-500 leading-tight truncate max-w-[180px]">
              {fieldWorker.name} -- {fieldWorker.organization}
            </span>
          )}
        </div>
      </div>

      {/* Right: Language Toggle Pill */}
      <button
        onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        className="relative flex items-center rounded-full text-sm font-semibold
                   bg-slate-100/80 border border-slate-200/60 overflow-hidden
                   active:scale-95 transition-all duration-200 cursor-pointer select-none"
        style={{ height: 34 }}
      >
        <span
          className={`px-3 py-1 transition-all duration-200 ${
            lang === 'hi'
              ? 'text-white'
              : 'text-slate-500'
          }`}
          style={{ position: 'relative', zIndex: 1 }}
        >
          हिं
        </span>
        <span
          className={`px-3 py-1 transition-all duration-200 ${
            lang === 'en'
              ? 'text-white'
              : 'text-slate-500'
          }`}
          style={{ position: 'relative', zIndex: 1 }}
        >
          En
        </span>
        {/* Sliding pill indicator */}
        <span
          className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
          style={{
            width: '50%',
            left: lang === 'hi' ? '2px' : 'calc(50% - 2px)',
            background: 'linear-gradient(135deg, #ED7023, #764F90)',
            boxShadow: '0 2px 8px rgba(237,112,35,0.3)',
            zIndex: 0,
          }}
        />
      </button>
    </header>
  )
}
