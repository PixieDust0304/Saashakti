import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { isConfigured, getCoverageGapStats } from '../lib/supabase'
import { ArrowLeft, TrendingDown, Target, IndianRupee, Users } from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'

interface CoverageStats {
  total_eligible_matches: number
  already_receiving: number
  eligible_not_receiving: number
  total_unclaimed_annual_value: number
  coverage_rate: number
  by_scheme: Array<{
    scheme_id: string
    name_hi: string
    name_en: string
    total_eligible: number
    already_receiving: number
    gap: number
    unclaimed_value: number
  }>
}

function formatLakhs(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export default function CoverageGapPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [stats, setStats] = useState<CoverageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const s = (await getCoverageGapStats()) as CoverageStats | null
      setStats(s)
      setLoading(false)
    })()
  }, [])

  const maxGap = stats?.by_scheme.reduce((m, s) => Math.max(m, s.gap), 0) ?? 1

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-saffron-600 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{lang === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target size={18} className="text-saffron-600" />
            {lang === 'hi' ? 'कवरेज गैप विश्लेषण' : 'Coverage gap analysis'}
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 relative z-10">
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {lang === 'hi'
              ? 'Supabase कॉन्फ़िगर नहीं — डेमो डेटा दिखा रहा है।'
              : 'Supabase not configured — demo mode only.'}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}
          </div>
        ) : !stats || stats.total_eligible_matches === 0 ? (
          <div className="text-center py-16">
            <TrendingDown size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {lang === 'hi'
                ? 'अभी कोई पंजीकरण नहीं — पहले लाभार्थी जोड़ें।'
                : 'No registrations yet — add beneficiaries first.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Headline stats ─────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <HeadlineCard
                icon={<Users size={18} />}
                value={stats.total_eligible_matches.toLocaleString('en-IN')}
                label={lang === 'hi' ? 'कुल पात्रता मिलान' : 'Eligibility matches'}
                color="#0F172A"
              />
              <HeadlineCard
                icon={<TrendingDown size={18} />}
                value={stats.eligible_not_receiving.toLocaleString('en-IN')}
                label={lang === 'hi' ? 'पात्र पर वंचित' : 'Eligible, not receiving'}
                color="#DC2626"
                highlight
              />
              <HeadlineCard
                icon={<Target size={18} />}
                value={`${stats.coverage_rate}%`}
                label={lang === 'hi' ? 'कवरेज दर' : 'Coverage rate'}
                color="#16A34A"
              />
              <HeadlineCard
                icon={<IndianRupee size={18} />}
                value={formatLakhs(stats.total_unclaimed_annual_value)}
                label={lang === 'hi' ? 'वार्षिक अवितरित' : 'Annual unclaimed'}
                color="#F97316"
                highlight
              />
            </div>

            {/* ── Explainer ───────────────────────────────────── */}
            <div className="glass-card p-4 mb-6 text-sm text-slate-700">
              <p className="leading-relaxed">
                {lang === 'hi' ? (
                  <>
                    यह विश्लेषण दिखाता है कि कितनी महिलाएँ किसी योजना के लिए <span className="font-semibold text-saffron-700">पात्र</span> हैं
                    लेकिन अभी तक लाभ <span className="font-semibold text-red-600">प्राप्त नहीं कर रही</span> हैं।
                    हर पंक्ति नारंगी बार उन महिलाओं की संख्या है जिन तक पहुँच बाकी है।
                  </>
                ) : (
                  <>
                    This view shows women who are <span className="font-semibold text-saffron-700">eligible</span> for a scheme
                    but <span className="font-semibold text-red-600">not yet receiving</span> the benefit.
                    The orange bar is the outreach gap per scheme.
                  </>
                )}
              </p>
            </div>

            {/* ── Per-scheme table ────────────────────────────── */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-6">
                  {lang === 'hi' ? 'योजना' : 'Scheme'}
                </div>
                <div className="col-span-2 text-right">
                  {lang === 'hi' ? 'पात्र' : 'Eligible'}
                </div>
                <div className="col-span-2 text-right">
                  {lang === 'hi' ? 'प्राप्त' : 'Receiving'}
                </div>
                <div className="col-span-2 text-right">
                  {lang === 'hi' ? 'गैप' : 'Gap'}
                </div>
              </div>

              {stats.by_scheme.map((s, i) => {
                const pct = s.total_eligible > 0 ? (s.already_receiving / s.total_eligible) * 100 : 0
                const barWidth = (s.gap / maxGap) * 100
                return (
                  <motion.div
                    key={s.scheme_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4"
                  >
                    <div className="grid grid-cols-12 items-center gap-3">
                      <div className="col-span-6 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {lang === 'hi' ? s.name_hi : s.name_en}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {lang === 'hi' ? 'कवरेज' : 'Coverage'}: {pct.toFixed(0)}% • {formatLakhs(s.unclaimed_value)} {lang === 'hi' ? 'अवितरित' : 'unclaimed'}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="text-base font-bold text-slate-900 font-mono">{s.total_eligible}</div>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="text-base font-bold text-green-600 font-mono">{s.already_receiving}</div>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="text-base font-bold text-saffron-600 font-mono">{s.gap}</div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.1 + i * 0.03, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #FB923C, #F97316, #EA580C)',
                        }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Footnote ───────────────────────────────────── */}
            <p className="text-[11px] text-slate-400 mt-6 text-center">
              {lang === 'hi'
                ? 'शीर्ष 15 योजनाएँ कवरेज गैप के अनुसार क्रमबद्ध • पूरा डेटा डैशबोर्ड पर'
                : 'Top 15 schemes ordered by gap • full data in the dashboard'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function HeadlineCard({
  icon, value, label, color, highlight,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
  highlight?: boolean
}) {
  return (
    <div
      className="glass-card p-4 flex flex-col gap-2 relative overflow-hidden"
      style={highlight ? {
        background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(255,255,255,0.8))',
        borderColor: 'rgba(249,115,22,0.2)',
      } : undefined}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold font-playfair" style={{ color }}>{value}</div>
    </div>
  )
}
