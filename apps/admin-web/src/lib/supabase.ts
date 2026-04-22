import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

export const isConfigured = !!(supabaseUrl && supabaseKey)

// ─── BENEFICIARY ───────────────────────────────────────────

export async function saveBeneficiary(profile: Record<string, unknown>) {
  if (!isConfigured) { console.warn('Supabase not configured'); return null }
  const { data, error } = await supabase
    .from('beneficiaries')
    .insert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── MATCHED SCHEMES ──────────────────────────────────────

export async function saveMatches(
  beneficiaryId: string,
  matches: Array<{
    scheme_id: string
    scheme_name_hi: string
    scheme_name_en: string
    benefit_amount: number | null
    benefit_frequency: string
    confidence: string
  }>
) {
  if (!isConfigured) return
  const rows = matches.map(m => ({ ...m, beneficiary_id: beneficiaryId }))
  const { error } = await supabase.from('matched_schemes').insert(rows)
  if (error) throw error
}

// ─── CURRENT BENEFITS (what she's already receiving) ──────

export async function saveCurrentBenefits(
  beneficiaryId: string,
  schemeIds: Array<{ scheme_id: string; scheme_name_hi: string; scheme_name_en?: string }>
) {
  if (!isConfigured || schemeIds.length === 0) return
  const rows = schemeIds.map(s => ({
    beneficiary_id: beneficiaryId,
    scheme_id: s.scheme_id,
    scheme_name_hi: s.scheme_name_hi,
    scheme_name_en: s.scheme_name_en || s.scheme_name_hi,
    self_declared: true,
  }))
  const { error } = await supabase.from('beneficiary_current_schemes').insert(rows)
  if (error) console.error('Failed to save current benefits:', error)
}

// ─── FIELD WORKER ─────────────────────────────────────────

export async function verifyFieldWorker(code: string) {
  if (!isConfigured) return null
  const { data, error } = await supabase
    .from('field_workers')
    .select('*')
    .eq('access_code', code)
    .single()
  if (error) return null
  return data
}

// ─── GRIEVANCE ────────────────────────────────────────────

export async function submitGrievance(grievance: {
  beneficiary_id?: string
  field_worker_id?: string
  scheme_id?: string
  scheme_name?: string
  grievance_type: string
  description: string
  district?: string
}) {
  if (!isConfigured) return null
  const { data, error } = await supabase
    .from('grievances')
    .insert(grievance)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listGrievances(filter?: {
  status?: string
  priority?: string
  district?: string
  grievance_type?: string
}) {
  if (!isConfigured) return []
  let q = supabase
    .from('grievances')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (filter?.status) q = q.eq('status', filter.status)
  if (filter?.priority) q = q.eq('priority', filter.priority)
  if (filter?.district) q = q.eq('district', filter.district)
  if (filter?.grievance_type) q = q.eq('grievance_type', filter.grievance_type)
  const { data, error } = await q
  if (error) { console.warn('listGrievances failed:', error); return [] }
  return data || []
}

export async function updateGrievanceStatus(
  id: string,
  next: { status?: string; priority?: string; resolution?: string; assigned_to?: string },
) {
  if (!isConfigured) return null
  const patch: Record<string, unknown> = { ...next, updated_at: new Date().toISOString() }
  if (next.status === 'resolved' || next.status === 'closed') {
    patch.resolved_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from('grievances')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── REAL-TIME DASHBOARD ──────────────────────────────────

export function subscribeToDashboard(callback: (count: number) => void) {
  return supabase
    .channel('dashboard')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'beneficiaries' },
      () => {
        getDashboardStats().then(stats => {
          if (stats) callback(stats.total_registrations)
        })
      }
    )
    .subscribe()
}

// ─── DASHBOARD: MAIN STATS ───────────────────────────────

export async function getDashboardStats() {
  if (!isConfigured) return null
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('district, is_bpl, is_pregnant, marital_status, total_schemes_matched, total_annual_benefit, profile_completeness')

  if (error || !data) return null

  return {
    total_registrations: data.length,
    districts: [...new Set(data.map(d => d.district))].length,
    total_matches: data.reduce((s, d) => s + (d.total_schemes_matched || 0), 0),
    total_benefit: data.reduce((s, d) => s + (d.total_annual_benefit || 0), 0),
    bpl_count: data.filter(d => d.is_bpl).length,
    pregnant_count: data.filter(d => d.is_pregnant).length,
    widow_count: data.filter(d => d.marital_status === 'widow').length,
    avg_completeness: data.length > 0
      ? Math.round(data.reduce((s, d) => s + (d.profile_completeness || 0), 0) / data.length)
      : 0,
    by_district: Object.entries(
      data.reduce((acc, d) => {
        acc[d.district] = (acc[d.district] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
  }
}

// ─── DASHBOARD: COVERAGE GAP ─────────────────────────────

export async function getCoverageGapStats() {
  if (!isConfigured) return null

  // Get all matched schemes
  const { data: matched } = await supabase
    .from('matched_schemes')
    .select('beneficiary_id, scheme_id, scheme_name_hi, scheme_name_en, benefit_amount, confidence')

  // Get all current benefits
  const { data: current } = await supabase
    .from('beneficiary_current_schemes')
    .select('beneficiary_id, scheme_id')

  if (!matched) return null

  const currentSet = new Set(
    (current || []).map(c => `${c.beneficiary_id}::${c.scheme_id}`)
  )

  // Per-scheme analysis
  const schemeStats: Record<string, {
    scheme_id: string
    name_hi: string
    name_en: string
    total_eligible: number
    already_receiving: number
    gap: number
    unclaimed_value: number
  }> = {}

  for (const m of matched) {
    if (!['eligible', 'partial'].includes(m.confidence)) continue
    const key = `${m.beneficiary_id}::${m.scheme_id}`
    const isReceiving = currentSet.has(key)

    if (!schemeStats[m.scheme_id]) {
      schemeStats[m.scheme_id] = {
        scheme_id: m.scheme_id,
        name_hi: m.scheme_name_hi,
        name_en: m.scheme_name_en,
        total_eligible: 0,
        already_receiving: 0,
        gap: 0,
        unclaimed_value: 0,
      }
    }
    const s = schemeStats[m.scheme_id]
    s.total_eligible++
    if (isReceiving) {
      s.already_receiving++
    } else {
      s.gap++
      s.unclaimed_value += (m.benefit_amount || 0)
    }
  }

  const schemes = Object.values(schemeStats).sort((a, b) => b.gap - a.gap)
  const totalEligible = schemes.reduce((s, x) => s + x.total_eligible, 0)
  const totalReceiving = schemes.reduce((s, x) => s + x.already_receiving, 0)
  const totalGap = schemes.reduce((s, x) => s + x.gap, 0)
  const totalUnclaimedValue = schemes.reduce((s, x) => s + x.unclaimed_value, 0)

  return {
    total_eligible_matches: totalEligible,
    already_receiving: totalReceiving,
    eligible_not_receiving: totalGap,
    total_unclaimed_annual_value: totalUnclaimedValue,
    coverage_rate: totalEligible > 0 ? Math.round((totalReceiving / totalEligible) * 100) : 0,
    by_scheme: schemes.slice(0, 15),
  }
}

// ─── DASHBOARD: RECENT REGISTRATIONS ─────────────────────

export async function getRecentRegistrations(limit = 10) {
  if (!isConfigured) return []
  const { data } = await supabase
    .from('beneficiaries')
    .select('id, name, district, age, marital_status, total_schemes_matched, total_annual_benefit, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

// ─── DASHBOARD: TOP SCHEMES ──────────────────────────────

export async function getTopSchemes(limit = 10) {
  if (!isConfigured) return []
  const { data } = await supabase
    .from('matched_schemes')
    .select('scheme_id, scheme_name_hi, scheme_name_en')

  if (!data) return []

  const counts: Record<string, { name_hi: string; name_en: string; count: number }> = {}
  for (const d of data) {
    if (!counts[d.scheme_id]) counts[d.scheme_id] = { name_hi: d.scheme_name_hi, name_en: d.scheme_name_en, count: 0 }
    counts[d.scheme_id].count++
  }
  return Object.entries(counts)
    .map(([id, v]) => ({ scheme_id: id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// ─── DASHBOARD: GRIEVANCE STATS ──────────────────────────

export async function getGrievanceStats() {
  if (!isConfigured) return null
  const { data } = await supabase
    .from('grievances')
    .select('status, grievance_type, district')

  if (!data) return null

  return {
    total: data.length,
    open: data.filter(g => g.status === 'open').length,
    in_progress: data.filter(g => g.status === 'in_progress').length,
    resolved: data.filter(g => ['resolved', 'closed'].includes(g.status)).length,
    by_type: Object.entries(
      data.reduce((acc, g) => { acc[g.grievance_type] = (acc[g.grievance_type] || 0) + 1; return acc }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
  }
}

// ─── DATA EXPORT ─────────────────────────────────────────

export async function exportBeneficiaryData() {
  if (!isConfigured) return null
  const { data } = await supabase
    .from('beneficiaries')
    .select('*')
    .order('created_at', { ascending: true })
  return data
}

export async function exportMatchedSchemes() {
  if (!isConfigured) return null
  const { data } = await supabase
    .from('matched_schemes')
    .select('*, beneficiaries(name, district)')
    .order('created_at', { ascending: true })
  return data
}
