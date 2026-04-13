import React, { useRef, useState, useCallback } from "react";
import { motion, type Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GlowColor = "saffron" | "purple" | "success" | "none";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Enable 3D tilt on mouse move / touch (default false) */
  hover3d?: boolean;
  /** Colored border glow: saffron, purple, success, or none (default "none") */
  glowColor?: GlowColor;
  /** Framer-motion entry animation delay in seconds (default 0) */
  delay?: number;
  /** Click handler */
  onClick?: () => void;
  /** Enable fade-in + slide-up entry animation (default true) */
  animate?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum tilt angle in degrees */
const MAX_TILT = 6;

/** Glow color CSS class map */
const GLOW_CLASS_MAP: Record<GlowColor, string> = {
  saffron: "glass-card-saffron",
  purple: "glass-card-purple",
  success: "glass-card-success",
  none: "",
};

/** Box-shadow overrides for glow on hover/active states */
const GLOW_SHADOW_MAP: Record<GlowColor, string> = {
  saffron:
    "0 8px 32px rgba(0,0,0,0.2), 0 0 24px rgba(249,115,22,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
  purple:
    "0 8px 32px rgba(0,0,0,0.2), 0 0 24px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
  success:
    "0 8px 32px rgba(0,0,0,0.2), 0 0 24px rgba(19,136,8,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
  none: "",
};

// ---------------------------------------------------------------------------
// Framer-motion variants
// ---------------------------------------------------------------------------

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.97,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay,
      duration: 0.5,
      ease: [0.175, 0.885, 0.32, 1.275],
    },
  }),
};

// ---------------------------------------------------------------------------
// Ripple helper
// ---------------------------------------------------------------------------

interface Ripple {
  id: number;
  x: number;
  y: number;
}

let rippleCounter = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function GlassCard({
  children,
  className = "",
  hover3d = false,
  glowColor = "none",
  delay = 0,
  onClick,
  animate: enableAnimation = true,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // ---- 3D tilt calculation ----

  const calculateTilt = useCallback(
    (clientX: number, clientY: number) => {
      if (!hover3d || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalise cursor position to -1..1
      const normalX = (clientX - centerX) / (rect.width / 2);
      const normalY = (clientY - centerY) / (rect.height / 2);

      // Clamp to prevent extreme values when cursor is at edges
      const clampedX = Math.max(-1, Math.min(1, normalX));
      const clampedY = Math.max(-1, Math.min(1, normalY));

      // rotateY corresponds to horizontal movement, rotateX to vertical
      // Negate rotateX so the card tilts "toward" the cursor
      setTilt({
        rotateX: -clampedY * MAX_TILT,
        rotateY: clampedX * MAX_TILT,
      });
    },
    [hover3d],
  );

  const resetTilt = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  }, []);

  // ---- Mouse handlers ----

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      calculateTilt(e.clientX, e.clientY);
    },
    [calculateTilt],
  );

  const handleMouseLeave = useCallback(() => {
    resetTilt();
  }, [resetTilt]);

  // ---- Touch handlers ----

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      setIsHovered(true);
      calculateTilt(touch.clientX, touch.clientY);
    },
    [calculateTilt],
  );

  const handleTouchEnd = useCallback(() => {
    resetTilt();
  }, [resetTilt]);

  // ---- Ripple on click ----

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;

      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        const id = ++rippleCounter;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setRipples((prev) => [...prev, { id, x, y }]);

        // Clean up ripple after animation completes
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }

      onClick();
    },
    [onClick],
  );

  // ---- Build class list ----

  const glowClass = GLOW_CLASS_MAP[glowColor];
  const classes = [
    "glass-card",
    glowClass,
    onClick ? "glass-card-hover cursor-pointer" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // ---- 3D transform style ----

  const tiltStyle: React.CSSProperties = hover3d
    ? {
        transform: isHovered
          ? `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg)",
        transition: isHovered
          ? "transform 0.15s ease-out"
          : "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }
    : {};

  // ---- Glow box-shadow when hovered + glow colour set ----

  const glowShadowStyle: React.CSSProperties =
    isHovered && glowColor !== "none"
      ? { boxShadow: GLOW_SHADOW_MAP[glowColor] }
      : {};

  // ---- Render ----

  // If animations are disabled, render a plain div
  if (!enableAnimation) {
    return (
      <div
        ref={cardRef}
        className={classes}
        style={{ ...tiltStyle, ...glowShadowStyle, position: "relative", overflow: "hidden" }}
        onClick={onClick ? handleClick : undefined}
        onMouseMove={hover3d ? handleMouseMove : undefined}
        onMouseLeave={hover3d ? handleMouseLeave : undefined}
        onTouchMove={hover3d ? handleTouchMove : undefined}
        onTouchEnd={hover3d ? handleTouchEnd : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
        {/* Ripple layer */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: ripple.x - 40,
              top: ripple.y - 40,
              width: 80,
              height: 80,
              background: "rgba(255, 255, 255, 0.12)",
              transform: "scale(0)",
              animation: "glasscard-ripple 0.6s ease-out forwards",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={classes}
      style={{ ...tiltStyle, ...glowShadowStyle, position: "relative", overflow: "hidden" }}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      custom={delay}
      onClick={onClick ? handleClick : undefined}
      onMouseMove={hover3d ? handleMouseMove : undefined}
      onMouseLeave={hover3d ? handleMouseLeave : undefined}
      onTouchMove={hover3d ? handleTouchMove : undefined}
      onTouchEnd={hover3d ? handleTouchEnd : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
      {/* Ripple layer */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: ripple.x - 40,
            top: ripple.y - 40,
            width: 80,
            height: 80,
            background: "rgba(255, 255, 255, 0.12)",
            transform: "scale(0)",
            animation: "glasscard-ripple 0.6s ease-out forwards",
          }}
        />
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Inject keyframe for ripple animation (once, at module level)
// ---------------------------------------------------------------------------

if (typeof document !== "undefined") {
  const STYLE_ID = "glasscard-ripple-keyframes";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes glasscard-ripple {
        0%   { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(6); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default GlassCard;
