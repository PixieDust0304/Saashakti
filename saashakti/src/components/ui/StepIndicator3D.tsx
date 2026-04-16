import React, { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
   StepIndicator3D
   ---------------------------------------------------------------------------
   A horizontal step indicator with numbered circles connected by lines.
   Uses CSS classes from globals.css: step-3d, step-3d-active, step-3d-done,
   step-3d-pending, step-connector, step-connector-done.
   Pure CSS @keyframes for all animations -- no framer-motion.
   --------------------------------------------------------------------------- */

interface StepIndicator3DProps {
  currentStep: number;       // 1-based
  totalSteps: number;        // e.g. 5
  stepLabels?: string[];     // optional step labels
  onStepClick?: (step: number) => void;
}

/**
 * Determine step state relative to the current active step.
 */
function stepState(
  stepIndex: number,
  currentStep: number
): "active" | "done" | "pending" {
  const stepNum = stepIndex + 1;
  if (stepNum === currentStep) return "active";
  if (stepNum < currentStep) return "done";
  return "pending";
}

/**
 * Render the inner content of a step circle.
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
      <svg
        className="step-checkmark-svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline
          points="20 6 9 17 4 12"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: 0,
            animation: "checkmarkDraw 0.4s ease-out forwards",
          }}
        />
      </svg>
    );
  }
  return (
    <span
      className="leading-none"
      style={{
        animation:
          state === "active" ? "stepNumPopIn 0.35s ease-out" : undefined,
      }}
    >
      {stepNumber}
    </span>
  );
}

export default function StepIndicator3D({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick,
}: StepIndicator3DProps): React.JSX.Element {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  return (
    <div className="w-full px-4 pt-5 pb-2" role="navigation" aria-label="Progress steps">
      {/* Row of circles + connectors */}
      <div className="flex items-center w-full justify-center">
        {steps.map((i) => {
          const state = stepState(i, currentStep);
          const stepNumber = i + 1;
          const isLast = i === totalSteps - 1;
          const isClickable = onStepClick && (state === "done" || state === "active");

          return (
            <React.Fragment key={i}>
              {/* Step circle + optional label */}
              <div className="flex flex-col items-center relative">
                <button
                  type="button"
                  className={`step-3d ${
                    state === "active"
                      ? "step-3d-active step-3d-bounce"
                      : state === "done"
                        ? "step-3d-done"
                        : "step-3d-pending"
                  } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                  disabled={!isClickable}
                  aria-current={state === "active" ? "step" : undefined}
                  aria-label={`Step ${stepNumber}${stepLabels?.[i] ? `: ${stepLabels[i]}` : ""}${
                    state === "done"
                      ? " (completed)"
                      : state === "active"
                        ? " (current)"
                        : ""
                  }`}
                  style={{
                    transform: state === "active" ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, background 0.4s ease",
                  }}
                >
                  {/* Pulsing glow ring for active step */}
                  {state === "active" && (
                    <span
                      className="step-glow-ring"
                      aria-hidden="true"
                    />
                  )}

                  <StepContent state={state} stepNumber={stepNumber} />
                </button>

                {/* Optional label below circle -- hidden on mobile */}
                {stepLabels?.[i] && (
                  <span
                    className={`hidden sm:block mt-2 text-[10px] leading-tight text-center max-w-[72px] truncate font-medium transition-colors duration-400 ${
                      state === "active"
                        ? "text-saffron-600"
                        : state === "done"
                          ? "text-green-600"
                          : "text-slate-400"
                    }`}
                  >
                    {stepLabels[i]}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`step-connector ${
                    stepNumber < currentStep ? "step-connector-done" : ""
                  }`}
                  style={{
                    opacity: stepNumber < currentStep ? 1 : 0.5,
                    transition: "opacity 0.5s ease-in-out, background 0.7s ease",
                    minWidth: "24px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar underneath */}
      <ProgressBar3D progress={progressPercent} className="mt-3" />

      {/* Progress percentage text */}
      <p
        className="text-center text-xs font-semibold mt-1.5 tracking-wide"
        style={{
          background: "linear-gradient(135deg, #F97316, #7C3AED)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {progressPercent}% complete
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   ProgressBar3D
   ---------------------------------------------------------------------------
   Full-width rounded progress bar with glass track and gradient fill.
   CSS-only animations.
   --------------------------------------------------------------------------- */

interface ProgressBar3DProps {
  progress: number; // 0 to 100
  className?: string;
}

export function ProgressBar3D({
  progress,
  className = "",
}: ProgressBar3DProps): React.JSX.Element {
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
      {/* Track */}
      <div
        className="relative w-full overflow-hidden rounded-full"
        style={{
          height: 6,
          background: "rgba(0, 0, 0, 0.06)",
          boxShadow:
            "inset 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #F97316, #7C3AED)",
            width: `${clamped}%`,
            transition: "width 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {/* Glowing leading edge */}
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
        </div>
      </div>
    </div>
  );
}
