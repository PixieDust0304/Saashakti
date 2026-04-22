import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import { isConfigured, listGrievances, submitGrievance, updateGrievanceStatus } from '../lib/supabase'
import districts from '../data/districts-cg.json'
import { AlertTriangle, Plus, Filter, X, CheckCircle2, Clock, ArrowLeft, ChevronRight } from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'

/* ──────────────────────────────────────────────────────────────
   Types mirror the supabase grievances table (migration 002)
────────────────────────────────────────────────────────────── */
type GrievanceType =
  | 'benefit_not_received' | 'application_rejected' | 'wrong_amount'
  | 'document_issue' | 'portal_issue' | 'field_worker_complaint'
  | 'scheme_info_wrong' | 'other'

type GrievanceStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'escalated'
type GrievancePriority = 'low' | 'normal' | 'high' | 'urgent'

interface Grievance {
  id: string
  beneficiary_id?: string | null
  scheme_id?: string | null
  scheme_name?: string | null
  grievance_type: GrievanceType
  description: string
  status: GrievanceStatus
  priority: GrievancePriority
  district?: string | null
  assigned_to?: string | null
  resolution?: string | null
  created_at: string
  updated_at?: string
  resolved_at?: string | null
}

const GRIEVANCE_TYPES: { key: GrievanceType; hi: string; en: string }[] = [
  { key: 'benefit_not_received', hi: 'लाभ नहीं मिला', en: 'Benefit not received' },
  { key: 'application_rejected', hi: 'आवेदन अस्वीकृत', en: 'Application rejected' },
  { key: 'wrong_amount', hi: 'गलत राशि', en: 'Wrong amount' },
  { key: 'document_issue', hi: 'दस्तावेज़ संबंधी', en: 'Document issue' },
  { key: 'portal_issue', hi: 'पोर्टल समस्या', en: 'Portal issue' },
  { key: 'field_worker_complaint', hi: 'फील्ड वर्कर शिकायत', en: 'Field worker complaint' },
  { key: 'scheme_info_wrong', hi: 'योजना जानकारी गलत', en: 'Scheme info wrong' },
  { key: 'other', hi: 'अन्य', en: 'Other' },
]

const STATUS_META: Record<GrievanceStatus, { hi: string; en: string; color: string; bg: string }> = {
  open:         { hi: 'खुला',       en: 'Open',         color: '#DC2626', bg: '#FEE2E2' },
  acknowledged: { hi: 'स्वीकृत',    en: 'Acknowledged',  color: '#D97706', bg: '#FEF3C7' },
  in_progress:  { hi: 'प्रक्रियाधीन', en: 'In progress',  color: '#2563EB', bg: '#DBEAFE' },
  resolved:     { hi: 'हल',        en: 'Resolved',     color: '#16A34A', bg: '#DCFCE7' },
  closed:       { hi: 'बंद',        en: 'Closed',       color: '#64748B', bg: '#F1F5F9' },
  escalated:    { hi: 'बढ़ाया गया',   en: 'Escalated',    color: '#9333EA', bg: '#F3E8FF' },
}

const PRIORITY_META: Record<GrievancePriority, { hi: string; en: string; color: string }> = {
  low:    { hi: 'कम',    en: 'Low',    color: '#64748B' },
  normal: { hi: 'सामान्य', en: 'Normal', color: '#2563EB' },
  high:   { hi: 'उच्च',   en: 'High',   color: '#EA580C' },
  urgent: { hi: 'तत्काल',  en: 'Urgent', color: '#DC2626' },
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default function GrievancePage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [items, setItems] = useState<Grievance[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<Grievance | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const reload = async () => {
    setLoading(true)
    const rows = (await listGrievances()) as Grievance[]
    setItems(rows)
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    return items.filter(g => {
      if (filterStatus !== 'all' && g.status !== filterStatus) return false
      if (filterPriority !== 'all' && g.priority !== filterPriority) return false
      return true
    })
  }, [items, filterStatus, filterPriority])

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter(g => g.status === 'open').length,
      in_progress: items.filter(g => g.status === 'in_progress').length,
      resolved: items.filter(g => g.status === 'resolved' || g.status === 'closed').length,
      urgent: items.filter(g => g.priority === 'urgent').length,
    }
  }, [items])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-saffron-600 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{lang === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-saffron-600" />
            {lang === 'hi' ? 'शिकायत प्रबंधन' : 'Grievance management'}
          </h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 active:scale-95 transition-all"
          >
            <Plus size={16} />
            {lang === 'hi' ? 'नई शिकायत' : 'New grievance'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 relative z-10">
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {lang === 'hi'
              ? 'Supabase कॉन्फ़िगर नहीं — डेमो डेटा दिखा रहा है।'
              : 'Supabase not configured — demo mode only.'}
          </div>
        )}

        {/* ── Stats strip ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatPill label={lang === 'hi' ? 'कुल' : 'Total'} value={counts.total} color="#0F172A" />
          <StatPill label={lang === 'hi' ? 'खुला' : 'Open'} value={counts.open} color="#DC2626" />
          <StatPill label={lang === 'hi' ? 'प्रक्रियाधीन' : 'In progress'} value={counts.in_progress} color="#2563EB" />
          <StatPill label={lang === 'hi' ? 'हल' : 'Resolved'} value={counts.resolved} color="#16A34A" />
          <StatPill label={lang === 'hi' ? 'तत्काल' : 'Urgent'} value={counts.urgent} color="#DC2626" />
        </div>

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          <FilterPill
            label={lang === 'hi' ? 'सभी स्थितियाँ' : 'All statuses'}
            options={[
              { key: 'all', label: lang === 'hi' ? 'सभी' : 'All' },
              ...Object.entries(STATUS_META).map(([k, m]) => ({
                key: k,
                label: lang === 'hi' ? m.hi : m.en,
              })),
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          <FilterPill
            label={lang === 'hi' ? 'सभी प्राथमिकताएँ' : 'All priorities'}
            options={[
              { key: 'all', label: lang === 'hi' ? 'सभी' : 'All' },
              ...Object.entries(PRIORITY_META).map(([k, m]) => ({
                key: k,
                label: lang === 'hi' ? m.hi : m.en,
              })),
            ]}
            value={filterPriority}
            onChange={setFilterPriority}
          />
        </div>

        {/* ── List ────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {lang === 'hi' ? 'कोई शिकायत नहीं मिली' : 'No grievances match the filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(g => (
              <GrievanceRow
                key={g.id}
                g={g}
                lang={lang}
                onOpen={() => setSelected(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── New grievance modal ───────────────────────────────── */}
      <AnimatePresence>
        {showNew && (
          <NewGrievanceModal
            onClose={() => setShowNew(false)}
            onSaved={async () => {
              setShowNew(false)
              await reload()
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Detail / status-edit modal ────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <GrievanceDetailModal
            g={selected}
            onClose={() => setSelected(null)}
            onUpdated={async () => {
              setSelected(null)
              await reload()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Presentation helpers
────────────────────────────────────────────────────────────── */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card px-4 py-3 flex flex-col">
      <span className="text-xs text-slate-500 font-medium leading-tight">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value.toLocaleString('en-IN')}</span>
    </div>
  )
}

function FilterPill({
  options, value, onChange,
}: {
  label: string
  options: { key: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-sm px-3 py-1.5 rounded-lg bg-white/80 border border-black/10 text-slate-700 cursor-pointer"
    >
      {options.map(o => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </select>
  )
}

function GrievanceRow({ g, lang, onOpen }: { g: Grievance; lang: 'hi' | 'en'; onOpen: () => void }) {
  const status = STATUS_META[g.status]
  const priority = PRIORITY_META[g.priority]
  const typeLabel = GRIEVANCE_TYPES.find(t => t.key === g.grievance_type)
  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      className="w-full text-left glass-card p-4 flex items-center gap-4"
    >
      <div
        className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
        style={{ color: status.color, background: status.bg }}
      >
        {lang === 'hi' ? status.hi : status.en}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-900 truncate">
            {typeLabel ? (lang === 'hi' ? typeLabel.hi : typeLabel.en) : g.grievance_type}
          </span>
          {g.priority === 'urgent' || g.priority === 'high' ? (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: priority.color }}>
              {lang === 'hi' ? priority.hi : priority.en}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 line-clamp-1">{g.description}</p>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
          <span>{g.district || (lang === 'hi' ? 'जिला अज्ञात' : 'Unknown district')}</span>
          <span>•</span>
          <Clock size={10} className="inline" />
          <span>{new Date(g.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </motion.button>
  )
}

/* ──────────────────────────────────────────────────────────────
   New grievance modal
────────────────────────────────────────────────────────────── */
function NewGrievanceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const { lang } = useLang()
  const [type, setType] = useState<GrievanceType>('benefit_not_received')
  const [district, setDistrict] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<GrievancePriority>('normal')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (description.trim().length < 10) {
      setError(lang === 'hi' ? 'विवरण कम से कम 10 अक्षर' : 'Description must be at least 10 characters')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await submitGrievance({
        grievance_type: type,
        description: description.trim(),
        district: district || undefined,
      })
      // Priority — the current DB column is 'priority' on grievances,
      // but submitGrievance doesn't accept it yet; a future migration
      // can extend the RPC. For now priority defaults to 'normal'
      // server-side and the UI picker captures intent for later.
      void priority
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'File a grievance'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'शिकायत का प्रकार' : 'Grievance type'}
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as GrievanceType)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500"
            >
              {GRIEVANCE_TYPES.map(t => (
                <option key={t.key} value={t.key}>
                  {lang === 'hi' ? t.hi : t.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'जिला' : 'District'}
            </label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500"
            >
              <option value="">{lang === 'hi' ? 'जिला चुनें (वैकल्पिक)' : 'Pick district (optional)'}</option>
              {districts.map(d => (
                <option key={d.code} value={d.code}>
                  {lang === 'hi' ? d.name_hi : d.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'प्राथमिकता' : 'Priority'}
            </label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high', 'urgent'] as GrievancePriority[]).map(p => {
                const meta = PRIORITY_META[p]
                const active = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active ? 'text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                    }`}
                    style={active ? { background: meta.color } : {}}
                  >
                    {lang === 'hi' ? meta.hi : meta.en}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'विवरण' : 'Description'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder={lang === 'hi' ? 'विस्तार से लिखें…' : 'Describe in detail…'}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100"
          >
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 disabled:opacity-50"
          >
            {saving
              ? (lang === 'hi' ? 'दर्ज हो रहा है…' : 'Saving…')
              : (lang === 'hi' ? 'दर्ज करें' : 'Submit')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Detail / status-edit modal
────────────────────────────────────────────────────────────── */
function GrievanceDetailModal({
  g, onClose, onUpdated,
}: {
  g: Grievance
  onClose: () => void
  onUpdated: () => Promise<void>
}) {
  const { lang } = useLang()
  const [status, setStatus] = useState<GrievanceStatus>(g.status)
  const [resolution, setResolution] = useState(g.resolution ?? '')
  const [saving, setSaving] = useState(false)
  const typeLabel = GRIEVANCE_TYPES.find(t => t.key === g.grievance_type)

  const save = async () => {
    setSaving(true)
    try {
      await updateGrievanceStatus(g.id, { status, resolution: resolution || undefined })
      await onUpdated()
    } catch (e) {
      console.error('update failed', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {typeLabel ? (lang === 'hi' ? typeLabel.hi : typeLabel.en) : g.grievance_type}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {lang === 'hi' ? 'विवरण' : 'Description'}
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{g.description}</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{g.district || (lang === 'hi' ? 'जिला अज्ञात' : 'Unknown district')}</span>
            <span>•</span>
            <span>{new Date(g.created_at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'स्थिति बदलें' : 'Update status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated'] as GrievanceStatus[]).map(s => {
                const meta = STATUS_META[s]
                const active = status === s
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active ? 'ring-2 ring-offset-1' : 'hover:opacity-75'
                    }`}
                    style={{
                      background: active ? meta.color : meta.bg,
                      color: active ? '#fff' : meta.color,
                      boxShadow: active ? `0 0 0 2px ${meta.color}30` : undefined,
                    }}
                  >
                    {lang === 'hi' ? meta.hi : meta.en}
                  </button>
                )
              })}
            </div>
          </div>

          {(status === 'resolved' || status === 'closed') && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                {lang === 'hi' ? 'समाधान नोट' : 'Resolution note'}
              </label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                rows={3}
                placeholder={lang === 'hi' ? 'क्या किया गया?' : 'What was done?'}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
          <button
            onClick={save}
            disabled={saving || status === g.status}
            className="flex-1 py-2.5 rounded-lg bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} />
            {saving
              ? (lang === 'hi' ? 'सहेज रहा है…' : 'Saving…')
              : (lang === 'hi' ? 'अपडेट' : 'Update')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
