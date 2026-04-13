import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// StepIndicator3D
// ---------------------------------------------------------------------------
// A horizontal step indicator with numbered circles connected by lines.
// Uses CSS classes from globals.css: step-3d, step-3d-active, step-3d-done,
// step-3d-pending, step-connector, step-connector-done.
// Framer-motion provides scale, color, and layoutId animations.
// ---------------------------------------------------------------------------

interface StepIndicator3DProps {
  currentStep: number; // 1-based
  totalSteps: number; // e.g. 5
  labels?: string[]; // optional step labels
}

/**
 * Determine step state relative to the current active step.
 */
function stepState(
  stepIndex: number,
  currentStep: number
): "active" | "done" | "pending" {
  const stepNum = stepIndex + 1; // convert 0-based to 1-based
  if (stepNum === currentStep) return "active";
  if (stepNum < currentStep) return "done";
  return "pending";
}

/**
 * Map state to the corresponding globals.css class.
 */
function stepCssClass(state: "active" | "done" | "pending"): string {
  switch (state) {
    case "active":
      return "step-3d step-3d-active";
    case "done":
      return "step-3d step-3d-done";
    case "pending":
      return "step-3d step-3d-pending";
  }
}

/**
 * Render the inner content of a step circle -- either a checkmark (done),
 * the step number (active/pending).
 */
function StepContent({
  state,
  stepNumber,
}: {
  state: "active" | "done" | "pending";
  stepNumber: number;
}) {
  if (state === "done") {
    return (
      <motion.span
        key="check"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="leading-none text-base"
      >
        &#10003;
      </motion.span>
    );
  }
  return (
    <motion.span
      key="num"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="leading-none"
    >
      {stepNumber}
    </motion.span>
  );
}

export default function StepIndicator3D({
  currentStep,
  totalSteps,
  labels,
}: StepIndicator3DProps): React.JSX.Element {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="w-full" role="navigation" aria-label="Progress steps">
      {/* Row of circles + connectors */}
      <div className="flex items-center w-full">
        {steps.map((i) => {
          const state = stepState(i, currentStep);
          const stepNumber = i + 1;
          const isLast = i === totalSteps - 1;

          return (
            <React.Fragment key={i}>
              {/* ── Step circle ──────────────────────────────── */}
              <div className="flex flex-col items-center relative">
                <motion.div
                  className={stepCssClass(state)}
                  layout
                  animate={{
                    scale: state === "active" ? 1.15 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                    mass: 0.8,
                  }}
                  aria-current={state === "active" ? "step" : undefined}
                  aria-label={`Step ${stepNumber}${labels?.[i] ? `: ${labels[i]}` : ""}${state === "done" ? " (completed)" : state === "active" ? " (current)" : ""}`}
                >
                  {/* Glow ring that slides to the active step */}
                  {state === "active" && (
                    <motion.div
                      layoutId="step-glow-ring"
                      className="absolute inset-[-6px] rounded-full pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(124,58,237,0.25))",
                        boxShadow:
                          "0 0 18px rgba(249,115,22,0.35), 0 0 40px rgba(124,58,237,0.15)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <AnimatePresence mode="wait">
                    <StepContent
                      key={state === "done" ? "done" : "num"}
                      state={state}
                      stepNumber={stepNumber}
                    />
                  </AnimatePresence>
                </motion.div>

                {/* ── Optional label below circle ────────────── */}
                {labels?.[i] && (
                  <span
                    className={`mt-2 text-[10px] leading-tight text-center max-w-[64px] truncate ${
                      state === "active"
                        ? "text-orange-300"
                        : state === "done"
                          ? "text-emerald-400/70"
                          : "text-white/30"
                    }`}
                  >
                    {labels[i]}
                  </span>
                )}
              </div>

              {/* ── Connector line ───────────────────────────── */}
              {!isLast && (
                <motion.div
                  className={`step-connector ${
                    stepNumber < currentStep ? "step-connector-done" : ""
                  }`}
                  initial={false}
                  animate={{
                    opacity: stepNumber < currentStep ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar3D
// ---------------------------------------------------------------------------
// Full-width rounded progress bar with glass track and gradient fill.
// ---------------------------------------------------------------------------

interface ProgressBar3DProps {
  progress: number; // 0 to 100
  className?: string;
}

export function ProgressBar3D({
  progress,
  className = "",
}: ProgressBar3DProps): React.JSX.Element {
  // Clamp to 0-100
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${Math.round(clamped)}%`}
    >
      {/* ── Track ────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden rounded-full"
        style={{
          height: 6,
          background: "rgba(255, 255, 255, 0.06)",
          boxShadow:
            "inset 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
        }}
      >
        {/* ── Fill ───────────────────────────────────── */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #F97316, #7C3AED)",
          }}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* ── Glowing leading edge ─────────────────── */}
          {clamped > 0 && (
            <div
              className="absolute top-0 right-0 h-full w-3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.5))",
                boxShadow:
                  "0 0 8px rgba(124,58,237,0.6), 0 0 16px rgba(249,115,22,0.3)",
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
