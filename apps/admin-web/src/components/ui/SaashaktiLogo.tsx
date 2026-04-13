interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  glow?: boolean
}

export default function SaashaktiLogo({ size = 80, className = '', showText = false, glow = true }: LogoProps) {
  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Glow ring behind */}
        {glow && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(124,58,237,0.3))',
              filter: 'blur(16px)',
              transform: 'scale(1.3)',
            }}
          />
        )}
        {/* Main logo container */}
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #9333EA 50%, #7C3AED 100%)',
            boxShadow: '0 8px 32px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          {/* Woman silhouette SVG */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '70%', height: '70%' }}
          >
            {/* Head circle */}
            <circle cx="50" cy="24" r="12" fill="rgba(255,255,255,0.95)" />
            {/* Flowing hair */}
            <path
              d="M38 20 C35 28, 30 35, 28 42 C26 48, 30 50, 34 46 C37 43, 40 36, 42 30"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M62 20 C68 26, 74 32, 76 40 C78 48, 74 50, 70 46"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Body / upraised arms */}
            <path
              d="M50 36 C50 42, 50 50, 50 60 M50 44 C42 36, 34 32, 28 34 M50 44 C58 36, 66 32, 72 34"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Skirt / lower body */}
            <path
              d="M50 60 C44 70, 36 82, 32 88 M50 60 C56 70, 64 82, 68 88"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Empowerment dots / energy */}
            <circle cx="26" cy="28" r="2.5" fill="rgba(255,255,255,0.6)" />
            <circle cx="74" cy="28" r="2" fill="rgba(255,255,255,0.5)" />
            <circle cx="50" cy="14" r="1.5" fill="rgba(255,255,255,0.4)" />
          </svg>
        </div>
      </div>
      {showText && (
        <div className="text-center mt-1">
          <div
            className="font-bold text-lg"
            style={{
              background: 'linear-gradient(135deg, #F97316, #C084FC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            सशक्ति
          </div>
        </div>
      )}
    </div>
  )
}

/** Small circular logo for headers */
export function SaashaktiLogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #F97316, #7C3AED)',
        boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" style={{ width: '65%', height: '65%' }}>
        <circle cx="50" cy="24" r="11" fill="rgba(255,255,255,0.95)" />
        <path
          d="M50 36 L50 62 M50 44 C42 36, 34 32, 28 34 M50 44 C58 36, 66 32, 72 34 M50 62 C44 72, 36 84, 32 90 M50 62 C56 72, 64 84, 68 90"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
