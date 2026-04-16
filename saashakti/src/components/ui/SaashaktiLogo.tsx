interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  glow?: boolean
}

export default function SaashaktiLogo({ size = 80, className = '', showText = false, glow = true }: LogoProps) {
  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {glow && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(237,112,35,0.3), rgba(118,79,144,0.3))',
              filter: 'blur(16px)',
              transform: 'scale(1.3)',
            }}
          />
        )}
        <img
          src="/logo.png"
          alt="सशक्ति — Saashakti"
          className="relative w-full h-full object-contain drop-shadow-lg"
          style={{ borderRadius: size > 60 ? '1rem' : '0.5rem' }}
        />
      </div>
      {showText && (
        <div className="text-center mt-1">
          <div
            className="font-bold text-lg"
            style={{
              background: 'linear-gradient(135deg, #ED7023, #764F90)',
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

export function SaashaktiLogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="सशक्ति"
      className={`object-contain flex-shrink-0 drop-shadow-md ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
