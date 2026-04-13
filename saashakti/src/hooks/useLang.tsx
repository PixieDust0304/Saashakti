import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Lang } from '../engine/types'
import hi from '../data/lang/hi.json'
import en from '../data/lang/en.json'

const strings: Record<Lang, Record<string, string>> = { hi, en }

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'hi',
  setLang: () => {},
  t: (k) => k,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('hi')
  const t = (key: string) => strings[lang]?.[key] || strings['en']?.[key] || key
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
