import { useRef, useState, useEffect, useCallback } from "react";
import type React from "react";

// ---------------------------------------------------------------------------
// Indian number formatting helper
// ---------------------------------------------------------------------------

function formatIndianNumber(n: number): string {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return formatted + "," + last3;
}

function formatCurrency(n: number): string {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(1)}K`;
  return `\u20B9${formatIndianNumber(n)}`;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  value: number;
  className?: string;
  /** Animation duration in ms (default 2000) */
  duration?: number;
  /** Rendered before the number, e.g. "\u20B9" */
  prefix?: string;
  /** Rendered after the number, e.g. "/year" */
  suffix?: string;
  /** Formatting mode */
  format?: "number" | "currency" | "percentage";
}

export default function AnimatedCounter({
  value,
  className = "",
  duration = 2000,
  prefix,
  suffix,
  format = "number",
}: AnimatedCounterProps) {
  const prevValueRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const mountedRef = useRef(false);

  const formatValue = useCallback(
    (n: number) => {
      switch (format) {
        case "currency":
          return formatCurrency(n);
        case "percentage":
          return `${n.toFixed(1)}%`;
        default:
          return formatIndianNumber(n);
      }
    },
    [format],
  );

  useEffect(() => {
    // On first mount, animate from 0
    const from = mountedRef.current ? prevValueRef.current : 0;
    mountedRef.current = true;
    const to = value;

    if (from === to && prevValueRef.current === to) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + (to - from) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(to);
        prevValueRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      prevValueRef.current = to;
    };
  }, [value, duration]);

  const formatted = formatValue(displayValue);
  // If currency format, prefix is already included
  const showPrefix = format !== "currency" && prefix;

  return (
    <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
      {showPrefix && (
        <span className="opacity-70 mr-0.5">{prefix}</span>
      )}
      <span
        style={{
          display: "inline-block",
          fontVariantNumeric: "tabular-nums",
          willChange: "contents",
        }}
      >
        {formatted}
      </span>
      {suffix && (
        <span className="opacity-60 ml-0.5 text-[0.6em]">{suffix}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HeroCounter — the massive 8rem center counter
// ---------------------------------------------------------------------------

interface HeroCounterProps {
  value: number;
  label: string;
  sublabel?: string;
}

export function HeroCounter({ value, label, sublabel }: HeroCounterProps) {
  const prevValueRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [pulse, setPulse] = useState(false);
  const mountedRef = useRef(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const from = mountedRef.current ? prevValueRef.current : 0;
    mountedRef.current = true;
    const to = value;

    if (from === to && prevValueRef.current === to) return;

    // Trigger pulse on change (not initial)
    if (prevCountRef.current > 0 && to !== prevCountRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }
    prevCountRef.current = to;

    const duration = 2000;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + (to - from) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(to);
        prevValueRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      prevValueRef.current = to;
    };
  }, [value]);

  return (
    <div className="hero-counter-wrap text-center">
      <p className="text-saffron-400 text-lg font-medium tracking-wide mb-2 hero-counter-label">
        {label}
      </p>
      <div className="hero-counter-glow-container relative inline-block">
        {/* Glow backdrop */}
        <div
          className="hero-counter-glow-bg"
          aria-hidden
        />
        <span
          className={`hero-counter-number ${pulse ? "hero-counter-pulse" : ""}`}
          style={{
            fontSize: "8rem",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            display: "inline-block",
            color: "#fff",
          }}
        >
          {formatIndianNumber(displayValue)}
        </span>
      </div>
      {sublabel && (
        <p className="text-white/40 text-base mt-2">{sublabel}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetricCard — dark glass card with icon, animated counter, label
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  /** Optional formatted display string (overrides value) */
  formattedValue?: string;
  /** Format mode for AnimatedCounter */
  format?: "number" | "currency" | "percentage";
  prefix?: string;
  trend?: "up" | "down" | "neutral";
  staggerIndex?: number;
}

export function MetricCard({
  icon,
  value,
  label,
  color,
  formattedValue,
  format = "number",
  prefix,
  trend,
  staggerIndex = 0,
}: MetricCardProps) {
  return (
    <div
      className={`dashboard-glass-card metric-card-enter animate-stagger-${Math.min(staggerIndex + 1, 6)}`}
      style={{
        borderLeft: `4px solid ${color}`,
        "--metric-glow-color": color,
      } as React.CSSProperties}
    >
      {/* Top shine */}
      <div className="dashboard-glass-card-shine" aria-hidden />

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="metric-icon-circle"
          style={{
            background: `${color}22`,
            color: color,
          }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold leading-tight tracking-tight text-white">
              {formattedValue != null ? (
                formattedValue
              ) : (
                <AnimatedCounter
                  value={value}
                  format={format}
                  prefix={prefix}
                  duration={1800}
                />
              )}
            </p>
            {trend && trend !== "neutral" && (
              <span
                className={`metric-trend-arrow ${trend === "up" ? "metric-trend-up" : "metric-trend-down"}`}
              >
                {trend === "up" ? "\u2191" : "\u2193"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/45 leading-tight truncate mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DemoCard — smaller demographic stat card
// ---------------------------------------------------------------------------

interface DemoCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  staggerIndex?: number;
}

export function DemoCard({ icon, value, label, color, staggerIndex = 0 }: DemoCardProps) {
  return (
    <div
      className={`dashboard-glass-card demo-card-enter animate-stagger-${Math.min(staggerIndex + 1, 6)}`}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="dashboard-glass-card-shine" aria-hidden />
      <div className="flex items-center justify-center gap-3 py-1">
        <span style={{ color }} className="flex-shrink-0">
          {icon}
        </span>
        <span className="text-xl font-bold text-white">
          <AnimatedCounter value={value} duration={1500} />
        </span>
        <span className="text-xs text-white/45">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BarChart — horizontal bar chart with animated width
// ---------------------------------------------------------------------------

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  maxValue?: number;
  emptyMessage?: string;
}

export function BarChart({ data, maxValue, emptyMessage }: BarChartProps) {
  const [mounted, setMounted] = useState(false);
  const computedMax = maxValue ?? (data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1);

  useEffect(() => {
    // Trigger bar animation after mount
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (data.length === 0) {
    return (
      <p className="text-white/30 text-xs text-center py-3">
        {emptyMessage || "\u0905\u092D\u0940 \u0915\u094B\u0908 \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902"}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {data.map((item, idx) => {
        const barWidth = computedMax > 0
          ? Math.max((item.value / computedMax) * 100, 6)
          : 6;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-white/60 w-28 truncate capitalize text-right flex-shrink-0">
              {item.label.replace(/_/g, " ")}
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded dashboard-bar-gradient flex items-center justify-end pr-2"
                style={{
                  width: mounted ? `${barWidth}%` : "0%",
                  transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + idx * 0.06}s`,
                }}
              >
                <span className="text-[10px] font-bold text-white/90">{item.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LiveIndicator — pulsing green dot + "LIVE" text
// ---------------------------------------------------------------------------

interface LiveIndicatorProps {
  isConnected: boolean;
}

export function LiveIndicator({ isConnected }: LiveIndicatorProps) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="live-dot" />
        <span className="text-green-400 text-sm font-semibold tracking-wider">LIVE</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{
          background: "#FBBF24",
          boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
        }}
      />
      <span className="text-amber-400 text-sm font-semibold">
        {"\u26A0"} Reconnecting
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SchemeBar — for scheme breakdown
// ---------------------------------------------------------------------------

interface SchemeBarProps {
  name: string;
  count: number;
  maxCount: number;
  rank: number;
}

export function SchemeBar({ name, count, maxCount, rank }: SchemeBarProps) {
  const [mounted, setMounted] = useState(false);
  const barPct = Math.max((count / (maxCount || 1)) * 100, 10);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{
          background:
            rank === 0
              ? "linear-gradient(135deg, #ED7023, #FB923C)"
              : "rgba(255,255,255,0.08)",
          color: rank === 0 ? "#fff" : "rgba(255,255,255,0.45)",
        }}
      >
        {rank + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60 truncate leading-tight">{name}</p>
        <div
          className="w-full h-1.5 rounded-full mt-0.5 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: mounted ? `${barPct}%` : "0%",
              background: "linear-gradient(90deg, #138808, #22C55E)",
              transition: `width 700ms cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + rank * 0.1}s`,
            }}
          />
        </div>
      </div>
      <span className="text-[10px] font-bold text-white/40 flex-shrink-0 w-8 text-right">
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityFeed — recent registration entries with slide-in animation
// ---------------------------------------------------------------------------

interface ActivityEntry {
  name: string;
  district: string;
  created_at: string;
  timeAgo: string;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <p className="text-white/30 text-xs text-center py-4">
        {"\u0905\u092D\u0940 \u0915\u094B\u0908 \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902"}
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {entries.map((reg, i) => (
        <div
          key={reg.name + reg.created_at}
          className="activity-entry flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0"
          style={{
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/80 truncate font-medium">{reg.name}</p>
            <p className="text-[10px] text-white/35 capitalize">{reg.district?.replace(/_/g, " ")}</p>
          </div>
          <span className="text-[10px] text-saffron-400 flex-shrink-0 ml-2 font-medium">
            {reg.timeAgo}
          </span>
        </div>
      ))}
    </div>
  );
}
