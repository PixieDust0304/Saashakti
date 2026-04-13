import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDashboardStats, subscribeToDashboard, supabase } from '../lib/supabase'
import { Users, MapPin, Award, IndianRupee, Heart, Baby, Shield, TrendingUp, Zap } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  total_registrations: number
  districts: number
  total_matches: number
  total_benefit: number
  bpl_count: number
  pregnant_count: number
  widow_count: number
  by_district: [string, number][]
}

interface TopScheme {
  name: string
  count: number
}

interface RecentReg {
  name: string
  district: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function getTopSchemes(): Promise<TopScheme[]> {
  const { data } = await supabase
    .from('matched_schemes')
    .select('scheme_id, scheme_name_hi')
  if (!data) return []
  const counts: Record<string, { name: string; count: number }> = {}
  data.forEach(d => {
    if (!counts[d.scheme_id]) counts[d.scheme_id] = { name: d.scheme_name_hi, count: 0 }
    counts[d.scheme_id].count++
  })
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5)
}

async function getRecentRegistrations(): Promise<RecentReg[]> {
  const { data } = await supabase
    .from('beneficiaries')
    .select('name, district, created_at')
    .order('created_at', { ascending: false })
    .limit(8)
  return data || []
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '\u0905\u092D\u0940'
  if (mins < 60) return `${mins} \u092E\u093F\u0928\u091F \u092A\u0939\u0932\u0947`
  return `${Math.floor(mins / 60)} \u0918\u0902\u091F\u0947 \u092A\u0939\u0932\u0947`
}

function formatLakhs(n: number): string {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)} L`
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(1)}K`
  return `\u20B9${n}`
}

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else prevRef.current = target
    }

    requestAnimationFrame(tick)
  }, [target, duration])

  return display
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div
      className="h-screen w-screen overflow-hidden text-white relative"
      style={{
        background: 'linear-gradient(135deg, #0A1929 0%, #0F172A 30%, #1a0a20 65%, #0A1929 100%)',
      }}
    >
      {/* Header skeleton */}
      <div className="glass-header h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div>
            <div className="skeleton w-48 h-5 rounded mb-1" />
            <div className="skeleton w-64 h-3 rounded" />
          </div>
        </div>
        <div className="skeleton w-16 h-5 rounded" />
      </div>

      <div className="px-6 pt-5">
        {/* Main counter skeleton */}
        <div className="flex flex-col items-center mb-4">
          <div className="skeleton w-56 h-4 rounded mb-3" />
          <div className="skeleton w-80 h-24 rounded-2xl mb-2" />
          <div className="skeleton w-40 h-4 rounded" />
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-4 gap-4 mb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>

        {/* 3 demographic cards */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>

        {/* District chart + bottom panels */}
        <div className="skeleton h-40 rounded-xl mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-36 rounded-xl" />
          <div className="skeleton h-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [topSchemes, setTopSchemes] = useState<TopScheme[]>([])
  const [recentRegs, setRecentRegs] = useState<RecentReg[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [counterPulse, setCounterPulse] = useState(false)
  const prevRegCount = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animated values for all numeric fields
  const animatedTotal = useAnimatedValue(stats?.total_registrations ?? 0, 1000)
  const animatedDistricts = useAnimatedValue(stats?.districts ?? 0, 700)
  const animatedMatches = useAnimatedValue(stats?.total_matches ?? 0, 800)
  const animatedBenefit = useAnimatedValue(stats?.total_benefit ?? 0, 900)
  const animatedBPL = useAnimatedValue(stats?.bpl_count ?? 0, 600)
  const animatedPregnant = useAnimatedValue(stats?.pregnant_count ?? 0, 600)
  const animatedWidow = useAnimatedValue(stats?.widow_count ?? 0, 600)

  // Fetch all 3 data sources
  const fetchAll = useCallback(async () => {
    try {
      const [dashData, schemes, regs] = await Promise.all([
        getDashboardStats(),
        getTopSchemes(),
        getRecentRegistrations(),
      ])
      if (dashData) {
        setStats(dashData as DashboardData)
        // Trigger pulse animation on counter change
        if (dashData.total_registrations !== prevRegCount.current && prevRegCount.current !== 0) {
          setCounterPulse(true)
          setTimeout(() => setCounterPulse(false), 400)
        }
        prevRegCount.current = dashData.total_registrations
      }
      setTopSchemes(schemes)
      setRecentRegs(regs)
      setIsConnected(true)
      if (!isLoaded) setIsLoaded(true)
    } catch {
      setIsConnected(false)
    }
  }, [isLoaded])

  // Debounced refetch for realtime events
  const debouncedRefetch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchAll()
    }, 2000)
  }, [fetchAll])

  useEffect(() => {
    // Initial fetch
    fetchAll()

    // Polling interval (8 seconds)
    const pollInterval = setInterval(fetchAll, 8000)

    // Realtime subscription
    const channel = subscribeToDashboard(() => {
      debouncedRefetch()
    })

    return () => {
      clearInterval(pollInterval)
      channel.unsubscribe()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [fetchAll, debouncedRefetch])

  // Show skeleton on initial load
  if (!isLoaded || !stats) {
    return <DashboardSkeleton />
  }

  const avgSchemes = stats.total_registrations > 0
    ? (stats.total_matches / stats.total_registrations).toFixed(1)
    : '0'

  const maxDistrictCount = stats.by_district.length > 0
    ? Math.max(...stats.by_district.map(d => d[1]))
    : 1

  return (
    <div
      className="h-screen w-screen overflow-hidden text-white relative"
      style={{
        background: 'linear-gradient(135deg, #0A1929 0%, #0F172A 30%, #1a0a20 65%, #0A1929 100%)',
      }}
    >
      {/* ============ FLOATING ORBS ============ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: '-8%',
            right: '-5%',
            background: 'radial-gradient(circle, #F97316, transparent 70%)',
            filter: 'blur(100px)',
            opacity: 0.08,
            animation: 'orbFloat 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: '-12%',
            left: '-8%',
            background: 'radial-gradient(circle, #7C3AED, transparent 70%)',
            filter: 'blur(100px)',
            opacity: 0.07,
            animation: 'orbFloat 30s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            top: '40%',
            left: '50%',
            background: 'radial-gradient(circle, #F97316, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.05,
            animation: 'orbFloat 20s ease-in-out infinite',
            animationDelay: '-8s',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* ============ HEADER BAR ============ */}
      <div className="glass-header h-16 flex items-center justify-between px-8 relative z-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
            }}
          >
            <span className="text-white font-bold text-xl leading-none"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
            >
              {'\u0938'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {'\u0938\u0936\u0915\u094D\u0924\u093F'} — Saashakti
            </h1>
            <p className="text-saffron-300 text-xs opacity-80">
              {'\u092E\u0939\u093F\u0932\u093E \u0915\u0932\u094D\u092F\u093E\u0923 \u092F\u094B\u091C\u0928\u093E \u092E\u093F\u0932\u093E\u0928 \u092E\u0902\u091A'}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="live-dot" />
              <span className="text-green-400 text-sm font-semibold tracking-wider">LIVE</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-amber-400" style={{
                boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)',
              }} />
              <span className="text-amber-400 text-sm font-semibold">
                {'\u26A0'} Connection
              </span>
            </>
          )}
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="relative z-10 px-6 pt-4 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* -------- MAIN COUNTER -------- */}
        <motion.div
          className="text-center mb-3 flex-shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-saffron-300 text-lg font-medium tracking-wide mb-1">
            {'\u0915\u0941\u0932 \u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u092E\u0939\u093F\u0932\u093E\u090F\u0902'}
          </p>
          <motion.div
            animate={counterPulse ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <span
              className="counter-glow inline-block"
              style={{
                fontSize: '8rem',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {animatedTotal.toLocaleString('en-IN')}
            </span>
          </motion.div>
          <p className="text-white/40 text-base mt-1">
            {'\u092E\u0939\u093F\u0932\u093E\u090F\u0902 \u092A\u0902\u091C\u0940\u0915\u0943\u0924'}
          </p>
        </motion.div>

        {/* -------- 4 METRIC CARDS -------- */}
        <div className="grid grid-cols-4 gap-4 mb-3 flex-shrink-0">
          <MetricCard
            icon={<MapPin size={22} />}
            value={animatedDistricts.toString()}
            label={'\u091C\u093F\u0932\u0947 \u0915\u0935\u0930 \u0915\u093F\u090F'}
            borderColor="#3B82F6"
            iconBg="rgba(59, 130, 246, 0.15)"
            delay={0.1}
          />
          <MetricCard
            icon={<Award size={22} />}
            value={animatedMatches.toLocaleString('en-IN')}
            label={'\u0915\u0941\u0932 \u092F\u094B\u091C\u0928\u093E \u092E\u093F\u0932\u093E\u0928'}
            borderColor="#22C55E"
            iconBg="rgba(34, 197, 94, 0.15)"
            delay={0.15}
          />
          <MetricCard
            icon={<IndianRupee size={22} />}
            value={formatLakhs(animatedBenefit)}
            label={'\u0915\u0941\u0932 \u0935\u093E\u0930\u094D\u0937\u093F\u0915 \u0932\u093E\u092D'}
            borderColor="#F97316"
            iconBg="rgba(249, 115, 22, 0.15)"
            delay={0.2}
          />
          <MetricCard
            icon={<TrendingUp size={22} />}
            value={avgSchemes}
            label={'\u0914\u0938\u0924 \u092F\u094B\u091C\u0928\u093E/\u092E\u0939\u093F\u0932\u093E'}
            borderColor="#A855F7"
            iconBg="rgba(168, 85, 247, 0.15)"
            delay={0.25}
          />
        </div>

        {/* -------- 3 DEMOGRAPHIC CARDS -------- */}
        <div className="grid grid-cols-3 gap-3 mb-3 flex-shrink-0">
          <DemoCard
            icon={<Shield size={18} />}
            value={animatedBPL}
            label={'\u092C\u0940\u092A\u0940\u090F\u0932'}
            color="#F59E0B"
            delay={0.3}
          />
          <DemoCard
            icon={<Baby size={18} />}
            value={animatedPregnant}
            label={'\u0917\u0930\u094D\u092D\u0935\u0924\u0940'}
            color="#EC4899"
            delay={0.35}
          />
          <DemoCard
            icon={<Heart size={18} />}
            value={animatedWidow}
            label={'\u0935\u093F\u0927\u0935\u093E'}
            color="#8B5CF6"
            delay={0.4}
          />
        </div>

        {/* -------- DISTRICT BAR CHART -------- */}
        <motion.div
          className="glass-card p-4 mb-3 flex-shrink-0"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <h2 className="text-sm font-semibold text-saffron-200 mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-saffron-400" />
            {'\u091C\u093F\u0932\u093E-\u0935\u093E\u0930 \u092A\u0902\u091C\u0940\u0915\u0930\u0923'}
          </h2>
          <div className="space-y-1.5">
            {stats.by_district.slice(0, 8).map(([district, count], idx) => {
              const barWidth = maxDistrictCount > 0
                ? Math.max((count / maxDistrictCount) * 100, 6)
                : 6
              return (
                <div key={district} className="flex items-center gap-2">
                  <span className="text-xs text-saffron-200/80 w-28 truncate capitalize text-right flex-shrink-0">
                    {district.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      className="h-full rounded bar-gradient flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.7, delay: 0.5 + idx * 0.05, ease: 'easeOut' }}
                    >
                      <span className="text-[10px] font-bold text-white/90">{count}</span>
                    </motion.div>
                  </div>
                </div>
              )
            })}
            {stats.by_district.length === 0 && (
              <p className="text-white/30 text-xs text-center py-3">
                {'\u0905\u092D\u0940 \u0915\u094B\u0908 \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902'}
              </p>
            )}
          </div>
        </motion.div>

        {/* -------- BOTTOM SPLIT: SCHEMES + RECENT -------- */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mb-2">

          {/* Left: Top Schemes */}
          <motion.div
            className="glass-card p-4 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <h2 className="text-sm font-semibold text-saffron-200 mb-2 flex items-center gap-2 flex-shrink-0">
              <Award size={14} className="text-green-400" />
              {'\u0936\u0940\u0930\u094D\u0937 \u092F\u094B\u091C\u0928\u093E\u090F\u0902'}
            </h2>
            <div className="space-y-1.5 flex-1 overflow-hidden">
              {topSchemes.length > 0 ? topSchemes.map((scheme, i) => {
                const maxSchemeCount = topSchemes[0]?.count || 1
                const barPct = Math.max((scheme.count / maxSchemeCount) * 100, 10)
                return (
                  <div key={scheme.name + i} className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: i === 0
                          ? 'linear-gradient(135deg, #F97316, #FB923C)'
                          : 'rgba(255,255,255,0.08)',
                        color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate leading-tight">{scheme.name}</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barPct}%`,
                            background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
                            transition: 'width 700ms ease',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/50 flex-shrink-0 w-8 text-right">
                      {scheme.count}
                    </span>
                  </div>
                )
              }) : (
                <p className="text-white/30 text-xs text-center py-4">
                  {'\u0905\u092D\u0940 \u0915\u094B\u0908 \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902'}
                </p>
              )}
            </div>
          </motion.div>

          {/* Right: Recent Registrations */}
          <motion.div
            className="glass-card p-4 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-sm font-semibold text-saffron-200 mb-2 flex items-center gap-2 flex-shrink-0">
              <Zap size={14} className="text-yellow-400" />
              {'\u0939\u093E\u0932 \u0915\u0947 \u092A\u0902\u091C\u0940\u0915\u0930\u0923'}
            </h2>
            <div className="flex-1 overflow-hidden space-y-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {recentRegs.length > 0 ? recentRegs.map((reg, i) => (
                  <motion.div
                    key={reg.name + reg.created_at}
                    className="flex items-center justify-between py-1 border-b border-white/5 last:border-b-0"
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 12, height: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/90 truncate font-medium">{reg.name}</p>
                      <p className="text-[10px] text-white/40 capitalize">{reg.district?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-[10px] text-saffron-300/60 flex-shrink-0 ml-2">
                      {timeAgo(reg.created_at)}
                    </span>
                  </motion.div>
                )) : (
                  <motion.p
                    key="empty"
                    className="text-white/30 text-xs text-center py-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {'\u0905\u092D\u0940 \u0915\u094B\u0908 \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="text-center py-1.5 flex-shrink-0">
          <p className="text-white/25 text-[10px] tracking-wide">
            {'\u092E\u0939\u093F\u0932\u093E \u090F\u0935\u0902 \u092C\u093E\u0932 \u0935\u093F\u0915\u093E\u0938 \u0935\u093F\u092D\u093E\u0917, \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0936\u093E\u0938\u0928'} &bull; Powered by Saashakti
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric Card (4-column row)
// ---------------------------------------------------------------------------

function MetricCard({ icon, value, label, borderColor, iconBg, delay }: {
  icon: React.ReactNode
  value: string
  label: string
  borderColor: string
  iconBg: string
  delay: number
}) {
  return (
    <motion.div
      className="glass-card p-4 flex items-center gap-3"
      style={{ borderLeft: `4px solid ${borderColor}` }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <span style={{ color: borderColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight tracking-tight">{value}</p>
        <p className="text-[11px] text-white/50 leading-tight truncate">{label}</p>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Demographic Card (3-column row)
// ---------------------------------------------------------------------------

function DemoCard({ icon, value, label, color, delay }: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      className="glass-card p-3 flex items-center justify-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <span style={{ color }} className="flex-shrink-0">{icon}</span>
      <span className="text-xl font-bold">{value.toLocaleString('en-IN')}</span>
      <span className="text-xs text-white/50">{label}</span>
    </motion.div>
  )
}
