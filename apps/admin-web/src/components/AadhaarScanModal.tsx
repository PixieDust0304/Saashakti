import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import jsQR from 'jsqr'
import { X, Camera, Upload, Sparkles, AlertTriangle } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import { parseAadhaarQr, type AadhaarParsed } from '../lib/aadhaar-qr'

interface Props {
  onParsed: (data: AadhaarParsed) => void
  onClose: () => void
}

const SCAN_TIMEOUT_MS = 30_000

export default function AadhaarScanModal({ onParsed, onClose }: Props) {
  const { t } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const scanStartRef = useRef<number>(Date.now())
  const acceptedRef = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<AadhaarParsed | null>(null)
  const [busy, setBusy] = useState(false)

  const stopCamera = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      scanStartRef.current = Date.now()
      scheduleNextFrame()
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'NotFoundError' || name === 'PermissionDeniedError') {
        setError(t('camera_denied'))
      } else {
        setError(t('camera_denied'))
      }
    }
  }

  const scheduleNextFrame = () => {
    rafIdRef.current = requestAnimationFrame(() => {
      void scanFrame()
    })
  }

  const scanFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scheduleNextFrame()
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      scheduleNextFrame()
      return
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    if (code) {
      try {
        const parsed = await parseAadhaarQr(code.data)
        stopCamera()
        setFound(parsed)
        setError(null)
        return
      } catch {
        // Non-Aadhaar QR or parse failure — keep scanning quietly.
      }
    }
    if (!error && Date.now() - scanStartRef.current > SCAN_TIMEOUT_MS) {
      setError(t('no_qr_found'))
    }
    scheduleNextFrame()
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    const imgUrl = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = imgUrl
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas_unavailable')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      if (!code) {
        setError(t('no_qr_found'))
        return
      }
      const parsed = await parseAadhaarQr(code.data)
      stopCamera()
      setFound(parsed)
    } catch {
      setError(t('no_qr_found'))
    } finally {
      URL.revokeObjectURL(imgUrl)
      setBusy(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRetry = () => {
    setFound(null)
    setError(null)
    scanStartRef.current = Date.now()
    void startCamera()
  }

  const handleAccept = () => {
    if (!found || acceptedRef.current) return
    acceptedRef.current = true
    onParsed(found)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  useEffect(() => {
    void startCamera()
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0, 0, 0, 0.92)', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Camera size={20} />
          {t('scan_aadhaar_title')}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 -m-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          aria-label={t('back')}
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera preview + overlays */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!found && (
          <div
            className="relative w-72 h-72 max-w-[80vw] max-h-[80vw] rounded-2xl"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              border: '2px solid rgba(249, 115, 22, 0.8)',
            }}
          >
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-saffron-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-saffron-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-saffron-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-saffron-400 rounded-br-lg" />
          </div>
        )}

        {found && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative glass-card p-5 max-w-sm mx-4 bg-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-saffron-500" />
              <h3 className="font-semibold text-slate-900">{t('scan_aadhaar_title')}</h3>
            </div>
            <dl className="space-y-2 text-sm mb-5">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t('name')}</dt>
                <dd className="font-medium text-slate-900 text-right">{found.name}</dd>
              </div>
              {found.age !== null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('age')}</dt>
                  <dd className="font-medium text-slate-900">{found.age}</dd>
                </div>
              )}
              {found.district && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">{t('district')}</dt>
                  <dd className="font-medium text-slate-900 text-right">{found.district}</dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="btn-3d btn-3d-secondary flex-1"
              >
                {t('try_again')}
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="btn-3d btn-3d-primary flex-1"
              >
                {t('use_this_data')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer: status + upload + privacy */}
      {!found && (
        <div className="px-5 py-4 text-white space-y-3">
          {error ? (
            <div className="flex items-start gap-2 text-sm text-amber-200 bg-amber-950/40 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-center text-sm text-white/80">{t('position_qr')}</p>
          )}

          <label
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4
              bg-white/10 hover:bg-white/15 border border-white/20
              text-white font-medium transition cursor-pointer ${busy ? 'opacity-60 cursor-wait' : ''}`}
          >
            <Upload size={16} />
            <span>{busy ? t('loading') : t('upload_photo')}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={busy}
              className="hidden"
            />
          </label>

          <p className="text-[11px] text-center text-white/50 leading-relaxed">
            {t('scanning_privacy')}
          </p>
        </div>
      )}
    </motion.div>
  )
}
