import { useRef, useState, useEffect, useCallback } from "react";
import type React from "react";
import { motion, animate } from "framer-motion";

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
  /** Animation duration in ms (default 800) */
  duration?: number;
  /** Rendered before the number, e.g. "\u20B9" */
  prefix?: string;
  /** Rendered after the number, e.g. "/year" */
  suffix?: string;
  /** Use Indian locale formatting 1,23,456 (default true) */
  formatIndian?: boolean;
}

export default function AnimatedCounter({
  value,
  className = "",
  duration = 800,
  prefix,
  suffix,
  formatIndian: useIndianFormat = true,
}: AnimatedCounterProps) {
  const prevValueRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(value);
  const numberRef = useRef<HTMLSpanElement>(null);

  const format = useCallback(
    (n: number) => (useIndianFormat ? formatIndianNumber(n) : Math.round(n).toLocaleString()),
    [useIndianFormat],
  );

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;

    // Nothing to animate
    if (from === to) return;

    // Trigger scale pulse via framer-motion animate
    if (numberRef.current) {
      animate(numberRef.current, { scale: [1, 1.08, 1] }, { duration: 0.2 });
    }
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

  return (
    <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
      {prefix && (
        <span className="opacity-70 mr-0.5">{prefix}</span>
      )}
      <motion.span
        ref={numberRef}
        style={{
          display: "inline-block",
          textShadow: "0 0 12px rgba(249, 115, 22, 0.45), 0 0 24px rgba(249, 115, 22, 0.2)",
          willChange: "transform",
        }}
      >
        {format(displayValue)}
      </motion.span>
      {suffix && (
        <span className="opacity-60 ml-0.5 text-[0.6em]">{suffix}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Color maps for MetricCard3D
// ---------------------------------------------------------------------------

type CardColor = "saffron" | "purple" | "blue" | "green";

const COLOR_MAP: Record<
  CardColor,
  { border: string; iconBg: string; accent: string }
> = {
  saffron: {
    border: "#F97316",
    iconBg: "rgba(249,115,22,0.15)",
    accent: "rgba(249,115,22,0.35)",
  },
  purple: {
    border: "#7C3AED",
    iconBg: "rgba(124,58,237,0.15)",
    accent: "rgba(124,58,237,0.35)",
  },
  blue: {
    border: "#3B82F6",
    iconBg: "rgba(59,130,246,0.15)",
    accent: "rgba(59,130,246,0.35)",
  },
  green: {
    border: "#138808",
    iconBg: "rgba(19,136,8,0.15)",
    accent: "rgba(19,136,8,0.35)",
  },
};

// ---------------------------------------------------------------------------
// MetricCard3D
// ---------------------------------------------------------------------------

interface MetricCard3DProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: CardColor;
  /** Stagger delay in seconds for entry animation */
  delay?: number;
  sublabel?: string;
}

export function MetricCard3D({
  icon,
  label,
  value,
  color,
  delay = 0,
  sublabel,
}: MetricCard3DProps) {
  const palette = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1], // custom ease-out
      }}
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderLeft: `4px solid ${palette.border}`,
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
      }}
      className="px-5 py-4"
    >
      {/* Subtle top-edge shine gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.18) 60%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Icon circle */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: palette.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          color: palette.border,
          fontSize: 16,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div
        className="text-2xl font-bold leading-tight text-white"
        style={{
          textShadow: `0 0 10px ${palette.accent}`,
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="text-xs text-white/50 mt-1 leading-snug">{label}</div>

      {/* Optional sublabel */}
      {sublabel && (
        <div className="text-[10px] text-white/35 mt-0.5 leading-snug">
          {sublabel}
        </div>
      )}
    </motion.div>
  );
}
