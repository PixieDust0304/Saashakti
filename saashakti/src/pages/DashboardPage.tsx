import { useState, useEffect, useCallback, useRef } from 'react'
import { getDashboardStats, subscribeToDashboard, supabase, isConfigured } from '../lib/supabase'
import { MapPin, Award, IndianRupee, Heart, Baby, Shield, TrendingUp, Zap, Clock } from 'lucide-react'
import { SaashaktiLogoMark } from '../components/ui/SaashaktiLogo'
import {
  HeroCounter,
  MetricCard,
  DemoCard,
  BarChart,
  LiveIndicator,
  SchemeBar,
  ActivityFeed,
} from '../components/ui/CounterMetrics'

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
  if (!isConfigured) return []
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
  if (!isConfigured) return []
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

function getCurrentDateTime(): string {
  const now = new Date()
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }
  return `${now.toLocaleDateString('hi-IN', dateOpts)} \u2014 ${now.toLocaleTimeString('hi-IN', timeOpts)}`
}

// ---------------------------------------------------------------------------
// Skeleton loading state (dark theme)
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 50%, #0A1929 100%)',
      }}
    >
      {/* Header skeleton */}
      <div className="h-16 flex items-center justify-between px-8" style={{ background: 'rgba(15,35,60,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton-dark w-10 h-10 rounded-full" />
          <div>
            <div className="skeleton-dark w-48 h-5 rounded mb-1" />
            <div className="skeleton-dark w-64 h-3 rounded" />
          </div>
        </div>
        <div className="skeleton-dark w-16 h-5 rounded" />
      </div>

      <div className="px-6 pt-5">
        {/* Main counter skeleton */}
        <div className="flex flex-col items-center mb-4">
          <div className="skeleton-dark w-56 h-4 rounded mb-3" />
          <div className="skeleton-dark w-80 h-24 rounded-2xl mb-2" />
          <div className="skeleton-dark w-40 h-4 rounded" />
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-4 gap-4 mb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-dark h-24 rounded-xl" />
          ))}
        </div>

        {/* 3 demographic cards */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-dark h-16 rounded-xl" />
          ))}
        </div>

        {/* District chart + bottom panels */}
        <div className="skeleton-dark h-40 rounded-xl mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton-dark h-36 rounded-xl" />
          <div className="skeleton-dark h-36 rounded-xl" />
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
  const [dateTime, setDateTime] = useState(getCurrentDateTime())
  const prevRegCount = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch all 3 data sources
  const fetchAll = useCallback(async () => {
    try {
      const [dashData, schemes, regs] = await Promise.all([
        getDashboardStats(),
        getTopSchemes(),
        getRecentRegistrations(),
      ])
      const resolved = (dashData as DashboardData) ?? {
        total_registrations: 0,
        districts: 0,
        total_matches: 0,
        total_benefit: 0,
        bpl_count: 0,
        pregnant_count: 0,
        widow_count: 0,
        by_district: [],
      }
      setStats(resolved)
      prevRegCount.current = resolved.total_registrations
      setTopSchemes(schemes)
      setRecentRegs(regs)
      setIsConnected(true)
      if (!isLoaded) setIsLoaded(true)
    } catch {
      setIsConnected(false)
      // Still show the dashboard with zeros rather than infinite skeleton
      if (!isLoaded) {
        setStats({
          total_registrations: 0, districts: 0, total_matches: 0, total_benefit: 0,
          bpl_count: 0, pregnant_count: 0, widow_count: 0, by_district: [],
        })
        setIsLoaded(true)
      }
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

    // Clock update every second
    const clockInterval = setInterval(() => {
      setDateTime(getCurrentDateTime())
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(clockInterval)
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

  const districtBarData = stats.by_district.slice(0, 8).map(([district, count]) => ({
    label: district,
    value: count,
  }))

  const activityEntries = recentRegs.map(reg => ({
    name: reg.name,
    district: reg.district,
    created_at: reg.created_at,
    timeAgo: timeAgo(reg.created_at),
  }))

  return (
    <div
      className="h-screen w-screen overflow-hidden relative dashboard-dark-root"
      style={{
        background: 'linear-gradient(135deg, #0A1929 0%, #0D2137 50%, #0A1929 100%)',
        color: '#fff',
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
            background: 'radial-gradient(circle, rgba(232,86,12,0.4), transparent 70%)',
            filter: 'blur(120px)',
            opacity: 0.12,
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
            background: 'radial-gradient(circle, rgba(118,79,144,0.4), transparent 70%)',
            filter: 'blur(120px)',
            opacity: 0.1,
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
            background: 'radial-gradient(circle, rgba(19,136,8,0.3), transparent 70%)',
            filter: 'blur(100px)',
            opacity: 0.06,
            animation: 'orbFloat 20s ease-in-out infinite',
            animationDelay: '-8s',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* ============ HEADER BAR ============ */}
      <div
        className="h-16 flex items-center justify-between px-8 relative z-10"
        style={{
          background: 'rgba(15,35,60,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <SaashaktiLogoMark size={48} />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {'\u0938\u0936\u0915\u094D\u0924\u093F \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921'}
            </h1>
            <p className="text-white/40 text-xs">
              {dateTime}
            </p>
          </div>
        </div>

        {/* Live indicator + auto-refresh */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-white/30 text-[10px]">
            <Clock size={10} />
            <span>Auto-refresh 8s</span>
          </div>
          <LiveIndicator isConnected={isConnected} />
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="relative z-10 px-6 pt-4 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* -------- HERO COUNTER -------- */}
        <div className="flex-shrink-0 mb-3 dashboard-fade-in">
          <HeroCounter
            value={stats.total_registrations}
            label={'\u0915\u0941\u0932 \u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u092E\u0939\u093F\u0932\u093E\u090F\u0902'}
            sublabel={'\u092E\u0939\u093F\u0932\u093E\u090F\u0902 \u092A\u0902\u091C\u0940\u0915\u0943\u0924'}
          />
        </div>

        {/* -------- 4 METRIC CARDS -------- */}
        <div className="grid grid-cols-4 gap-4 mb-3 flex-shrink-0">
          <MetricCard
            icon={<MapPin size={22} />}
            value={stats.districts}
            label={'\u091C\u093F\u0932\u0947 \u0915\u0935\u0930 \u0915\u093F\u090F'}
            color="#3B82F6"
            staggerIndex={0}
          />
          <MetricCard
            icon={<Award size={22} />}
            value={stats.total_matches}
            label={'\u0915\u0941\u0932 \u092F\u094B\u091C\u0928\u093E \u092E\u093F\u0932\u093E\u0928'}
            color="#22C55E"
            staggerIndex={1}
          />
          <MetricCard
            icon={<IndianRupee size={22} />}
            value={stats.total_benefit}
            formattedValue={formatLakhs(stats.total_benefit)}
            label={'\u0915\u0941\u0932 \u0935\u093E\u0930\u094D\u0937\u093F\u0915 \u0932\u093E\u092D'}
            color="#F97316"
            staggerIndex={2}
          />
          <MetricCard
            icon={<TrendingUp size={22} />}
            value={parseFloat(avgSchemes)}
            formattedValue={avgSchemes}
            label={'\u0914\u0938\u0924 \u092F\u094B\u091C\u0928\u093E/\u092E\u0939\u093F\u0932\u093E'}
            color="#A855F7"
            staggerIndex={3}
          />
        </div>

        {/* -------- 3 DEMOGRAPHIC CARDS -------- */}
        <div className="grid grid-cols-3 gap-3 mb-3 flex-shrink-0">
          <DemoCard
            icon={<Shield size={18} />}
            value={stats.bpl_count}
            label={'\u092C\u0940\u092A\u0940\u090F\u0932'}
            color="#F59E0B"
            staggerIndex={4}
          />
          <DemoCard
            icon={<Baby size={18} />}
            value={stats.pregnant_count}
            label={'\u0917\u0930\u094D\u092D\u0935\u0924\u0940'}
            color="#EC4899"
            staggerIndex={5}
          />
          <DemoCard
            icon={<Heart size={18} />}
            value={stats.widow_count}
            label={'\u0935\u093F\u0927\u0935\u093E'}
            color="#8B5CF6"
            staggerIndex={5}
          />
        </div>

        {/* -------- DISTRICT BAR CHART -------- */}
        <div
          className="dashboard-glass-card p-4 mb-3 flex-shrink-0 dashboard-slide-up animate-stagger-4"
        >
          <div className="dashboard-glass-card-shine" aria-hidden />
          <h2 className="text-sm font-semibold text-saffron-400 mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-saffron-400" />
            {'\u091C\u093F\u0932\u093E-\u0935\u093E\u0930 \u092A\u0902\u091C\u0940\u0915\u0930\u0923'}
          </h2>
          <BarChart
            data={districtBarData}
            emptyMessage={'\u0905\u092D\u0940 \u0915\u094B\u0908 \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902'}
          />
        </div>

        {/* -------- BOTTOM SPLIT: SCHEMES + RECENT -------- */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mb-2">

          {/* Left: Top Schemes */}
          <div
            className="dashboard-glass-card p-4 flex flex-col overflow-hidden dashboard-slide-up animate-stagger-5"
          >
            <div className="dashboard-glass-card-shine" aria-hidden />
            <h2 className="text-sm font-semibold text-saffron-400 mb-2 flex items-center gap-2 flex-shrink-0">
              <Award size={14} className="text-green-400" />
              {'\u0936\u0940\u0930\u094D\u0937 \u092F\u094B\u091C\u0928\u093E\u090F\u0902'}
            </h2>
            <div className="space-y-1.5 flex-1 overflow-hidden">
              {topSchemes.length > 0 ? topSchemes.map((scheme, i) => (
                <SchemeBar
                  key={scheme.name + i}
                  name={scheme.name}
                  count={scheme.count}
                  maxCount={topSchemes[0]?.count || 1}
                  rank={i}
                />
              )) : (
                <p className="text-white/30 text-xs text-center py-4">
                  {'\u0905\u092D\u0940 \u0915\u094B\u0908 \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902'}
                </p>
              )}
            </div>
          </div>

          {/* Right: Recent Registrations */}
          <div
            className="dashboard-glass-card p-4 flex flex-col overflow-hidden dashboard-slide-up animate-stagger-6"
          >
            <div className="dashboard-glass-card-shine" aria-hidden />
            <h2 className="text-sm font-semibold text-saffron-400 mb-2 flex items-center gap-2 flex-shrink-0">
              <Zap size={14} className="text-yellow-400" />
              {'\u0939\u093E\u0932 \u0915\u0947 \u092A\u0902\u091C\u0940\u0915\u0930\u0923'}
            </h2>
            <div className="flex-1 overflow-hidden">
              <ActivityFeed entries={activityEntries} />
            </div>
          </div>
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
