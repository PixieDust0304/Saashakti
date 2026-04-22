import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../hooks/useLang'
import {
  isConfigured,
  listMatchesForFollowUp,
  updateMatchApplicationStatus,
  type ApplicationStatus,
} from '../lib/supabase'
import districts from '../data/districts-cg.json'
import {
  ArrowLeft, CheckCircle2, Clock, Filter, X, ChevronRight, AlertCircle,
  TrendingUp, FileText,
} from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'

/* ──────────────────────────────────────────────────────────────
   Row shape (joined with beneficiaries) — minimal fields the UI uses
────────────────────────────────────────────────────────────── */
interface MatchRow {
  id: string
  scheme_id: string
  scheme_name_hi: string
  scheme_name_en?: string | null
  benefit_amount?: number | null
  confidence?: string
  application_status: ApplicationStatus
  applied_at?: string | null
  applied_via?: string | null
  status_updated_at?: string | null
  status_notes?: string | null
  follow_up_date?: string | null
  created_at: string
  beneficiaries?: {
    id: string
    name?: string
    district?: string
    phone?: string
    is_bpl?: boolean
    is_pregnant?: boolean
    marital_status?: string
  } | null
}

const STATUS_META: Record<ApplicationStatus, {
  hi: string; en: string; color: string; bg: string; order: number
}> = {
  identified:   { hi: 'पहचाना गया',    en: 'Identified',    color: '#64748B', bg: '#F1F5F9', order: 0 },
  informed:     { hi: 'सूचित',         en: 'Informed',      color: '#2563EB', bg: '#DBEAFE', order: 1 },
  applied:      { hi: 'आवेदन किया',      en: 'Applied',       color: '#D97706', bg: '#FEF3C7', order: 2 },
  under_review: { hi: 'समीक्षाधीन',      en: 'Under review',  color: '#9333EA', bg: '#F3E8FF', order: 3 },
  approved:     { hi: 'स्वीकृत',        en: 'Approved',      color: '#16A34A', bg: '#DCFCE7', order: 4 },
  receiving:    { hi: 'प्राप्त हो रहा',    en: 'Receiving',     color: '#059669', bg: '#D1FAE5', order: 5 },
  rejected:     { hi: 'अस्वीकृत',       en: 'Rejected',      color: '#DC2626', bg: '#FEE2E2', order: 6 },
  lapsed:       { hi: 'बंद',           en: 'Lapsed',        color: '#94A3B8', bg: '#F1F5F9', order: 7 },
}

const ALL_STATUSES: ApplicationStatus[] = [
  'identified', 'informed', 'applied', 'under_review',
  'approved', 'receiving', 'rejected', 'lapsed',
]

function formatINR(n?: number | null): string {
  if (!n) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export default function FollowUpPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MatchRow | null>(null)

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [districtFilter, setDistrictFilter] = useState<string>('')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const reload = async () => {
    setLoading(true)
    const data = await listMatchesForFollowUp({
      application_status: statusFilter,
      district: districtFilter || undefined,
      overdue_only: overdueOnly || undefined,
    })
    // PostgREST returns foreign-key joins as arrays even when the
    // relationship is one-to-many. Flatten beneficiaries[0] so the UI
    // can treat it as a single nested object.
    const flattened: MatchRow[] = (data as unknown as MatchRow[]).map(r => ({
      ...r,
      beneficiaries: Array.isArray((r as unknown as { beneficiaries: unknown }).beneficiaries)
        ? ((r as unknown as { beneficiaries: MatchRow['beneficiaries'][] }).beneficiaries[0] ?? null)
        : (r.beneficiaries ?? null),
    }))
    setRows(flattened)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, districtFilter, overdueOnly])

  const counts = useMemo(() => {
    const by: Record<string, number> = {}
    for (const r of rows) by[r.application_status] = (by[r.application_status] || 0) + 1
    const overdue = rows.filter(r =>
      r.follow_up_date && r.follow_up_date < new Date().toISOString().slice(0, 10) &&
      !['approved', 'receiving', 'rejected', 'lapsed'].includes(r.application_status)
    ).length
    return { total: rows.length, by, overdue }
  }, [rows])

  const grouped = useMemo(() => {
    const g: Record<ApplicationStatus, MatchRow[]> = {
      identified: [], informed: [], applied: [], under_review: [],
      approved: [], receiving: [], rejected: [], lapsed: [],
    }
    for (const r of rows) g[r.application_status]?.push(r)
    return g
  }, [rows])

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
            <FileText size={18} className="text-saffron-600" />
            {lang === 'hi' ? 'आवेदन ट्रैकिंग' : 'Application follow-up'}
          </h1>
          <div className="w-12" />
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
          <StatPill
            label={lang === 'hi' ? 'कुल' : 'Total'}
            value={counts.total}
            color="#0F172A"
          />
          <StatPill
            label={lang === 'hi' ? 'आवेदन किया' : 'Applied'}
            value={(counts.by.applied || 0) + (counts.by.under_review || 0)}
            color="#D97706"
          />
          <StatPill
            label={lang === 'hi' ? 'स्वीकृत' : 'Approved'}
            value={(counts.by.approved || 0) + (counts.by.receiving || 0)}
            color="#16A34A"
          />
          <StatPill
            label={lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}
            value={counts.by.rejected || 0}
            color="#DC2626"
          />
          <StatPill
            label={lang === 'hi' ? 'देर से' : 'Overdue'}
            value={counts.overdue}
            color="#EA580C"
            highlight
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/80 border border-black/10 text-slate-700 cursor-pointer"
          >
            <option value="all">{lang === 'hi' ? 'सभी स्थितियाँ' : 'All statuses'}</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>
                {lang === 'hi' ? STATUS_META[s].hi : STATUS_META[s].en}
              </option>
            ))}
          </select>

          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/80 border border-black/10 text-slate-700 cursor-pointer"
          >
            <option value="">{lang === 'hi' ? 'सभी जिले' : 'All districts'}</option>
            {districts.map(d => (
              <option key={d.code} value={d.code}>
                {lang === 'hi' ? d.name_hi : d.name_en}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
              className="accent-saffron-500"
            />
            <AlertCircle size={14} className="text-saffron-600" />
            {lang === 'hi' ? 'केवल देर से' : 'Overdue only'}
          </label>
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {lang === 'hi'
                ? 'कोई मिलान इस फ़िल्टर से मेल नहीं खाता'
                : 'No matches for current filters'}
            </p>
          </div>
        ) : statusFilter === 'all' ? (
          // When showing everything, group by status pipeline for clarity.
          <div className="space-y-6">
            {ALL_STATUSES
              .filter(s => (grouped[s]?.length || 0) > 0)
              .map(status => (
                <StatusGroup
                  key={status}
                  status={status}
                  items={grouped[status]}
                  lang={lang}
                  onOpen={setSelected}
                />
              ))}
          </div>
        ) : (
          // Filtered view — flat list.
          <div className="space-y-2">
            {rows.map(r => (
              <MatchRowCard
                key={r.id}
                row={r}
                lang={lang}
                onOpen={() => setSelected(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail / status update modal ──────────────────────── */}
      <AnimatePresence>
        {selected && (
          <StatusUpdateModal
            row={selected}
            lang={lang}
            onClose={() => setSelected(null)}
            onSaved={async () => {
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
function StatPill({
  label, value, color, highlight,
}: {
  label: string
  value: number
  color: string
  highlight?: boolean
}) {
  return (
    <div
      className="glass-card px-4 py-3 flex flex-col"
      style={highlight ? {
        background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(255,255,255,0.8))',
        borderColor: 'rgba(249,115,22,0.2)',
      } : undefined}
    >
      <span className="text-xs text-slate-500 font-medium leading-tight">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value.toLocaleString('en-IN')}</span>
    </div>
  )
}

function StatusGroup({
  status, items, lang, onOpen,
}: {
  status: ApplicationStatus
  items: MatchRow[]
  lang: 'hi' | 'en'
  onOpen: (r: MatchRow) => void
}) {
  const meta = STATUS_META[status]
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ color: meta.color, background: meta.bg }}
        >
          {lang === 'hi' ? meta.hi : meta.en}
        </div>
        <span className="text-slate-400 text-sm">
          {items.length} {lang === 'hi' ? 'मिलान' : 'matches'}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="space-y-2">
        {items.map(r => (
          <MatchRowCard key={r.id} row={r} lang={lang} onOpen={() => onOpen(r)} />
        ))}
      </div>
    </div>
  )
}

function MatchRowCard({
  row, lang, onOpen,
}: {
  row: MatchRow
  lang: 'hi' | 'en'
  onOpen: () => void
}) {
  const meta = STATUS_META[row.application_status]
  const ben = row.beneficiaries
  const schemeName = lang === 'hi' ? row.scheme_name_hi : (row.scheme_name_en || row.scheme_name_hi)
  const isOverdue = row.follow_up_date &&
    row.follow_up_date < new Date().toISOString().slice(0, 10) &&
    !['approved', 'receiving', 'rejected', 'lapsed'].includes(row.application_status)

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onOpen}
      className="w-full text-left glass-card p-4 flex items-center gap-4"
      style={isOverdue ? { borderLeft: '3px solid #EA580C' } : undefined}
    >
      <div className="flex-shrink-0 w-24 text-center">
        <div
          className="text-[11px] font-semibold px-2 py-1 rounded-md"
          style={{ color: meta.color, background: meta.bg }}
        >
          {lang === 'hi' ? meta.hi : meta.en}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">{schemeName}</div>
        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 truncate">
          {ben?.name && <span className="font-medium text-slate-700">{ben.name}</span>}
          {ben?.district && <span>• {ben.district}</span>}
          {ben?.phone && <span>• {ben.phone}</span>}
        </div>
        {row.status_notes && (
          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
            "{row.status_notes}"
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-bold text-saffron-600 font-mono">
          {formatINR(row.benefit_amount)}
        </div>
        {row.follow_up_date && (
          <div
            className={`text-[11px] mt-1 flex items-center gap-1 justify-end ${
              isOverdue ? 'text-saffron-700 font-semibold' : 'text-slate-400'
            }`}
          >
            <Clock size={10} />
            {new Date(row.follow_up_date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
          </div>
        )}
      </div>

      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </motion.button>
  )
}

/* ──────────────────────────────────────────────────────────────
   Status update modal
────────────────────────────────────────────────────────────── */
function StatusUpdateModal({
  row, lang, onClose, onSaved,
}: {
  row: MatchRow
  lang: 'hi' | 'en'
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [status, setStatus] = useState<ApplicationStatus>(row.application_status)
  const [notes, setNotes] = useState(row.status_notes || '')
  const [followUp, setFollowUp] = useState(row.follow_up_date || '')
  const [appliedVia, setAppliedVia] = useState(row.applied_via || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      await updateMatchApplicationStatus(row.id, {
        application_status: status,
        applied_via: appliedVia || undefined,
        status_notes: notes || undefined,
        follow_up_date: followUp || null,
      })
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const schemeName = lang === 'hi' ? row.scheme_name_hi : (row.scheme_name_en || row.scheme_name_hi)
  const ben = row.beneficiaries

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
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-bold text-slate-900 truncate">{schemeName}</h2>
            {ben && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {ben.name} • {ben.district} {ben.phone && `• ${ben.phone}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status picker — visual pipeline */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">
              {lang === 'hi' ? 'स्थिति अपडेट करें' : 'Update status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map(s => {
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

          {/* Applied via — only relevant once she's applied */}
          {['applied', 'under_review', 'approved', 'receiving', 'rejected', 'lapsed'].includes(status) && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                {lang === 'hi' ? 'कैसे आवेदन हुआ' : 'Applied via'}
              </label>
              <select
                value={appliedVia}
                onChange={e => setAppliedVia(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500"
              >
                <option value="">{lang === 'hi' ? 'चुनें…' : 'Pick a channel…'}</option>
                <option value="anganwadi">{lang === 'hi' ? 'आंगनवाड़ी केंद्र' : 'Anganwadi centre'}</option>
                <option value="csc">{lang === 'hi' ? 'CSC / लोक सेवा केंद्र' : 'CSC / Seva Kendra'}</option>
                <option value="bank">{lang === 'hi' ? 'बैंक शाखा' : 'Bank branch'}</option>
                <option value="online_portal">{lang === 'hi' ? 'ऑनलाइन पोर्टल' : 'Online portal'}</option>
                <option value="block_office">{lang === 'hi' ? 'ब्लॉक / तहसील कार्यालय' : 'Block / Tehsil office'}</option>
                <option value="shg">{lang === 'hi' ? 'SHG के माध्यम से' : 'Via SHG'}</option>
                <option value="camp">{lang === 'hi' ? 'शिविर में' : 'At a camp'}</option>
                <option value="other">{lang === 'hi' ? 'अन्य' : 'Other'}</option>
              </select>
            </div>
          )}

          {/* Follow-up date */}
          {['identified', 'informed', 'applied', 'under_review'].includes(status) && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                {lang === 'hi' ? 'अगली जाँच तारीख' : 'Next follow-up date'}
              </label>
              <input
                type="date"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {lang === 'hi' ? 'टिप्पणी' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={lang === 'hi'
                ? 'क्या हुआ? अगला क्या कदम?'
                : 'What happened? Next step?'}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-saffron-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
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
            disabled={saving}
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
