import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Save beneficiary profile
export async function saveBeneficiary(profile: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .insert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

// Save matched schemes for a beneficiary
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
  const rows = matches.map(m => ({ ...m, beneficiary_id: beneficiaryId }))
  const { error } = await supabase.from('matched_schemes').insert(rows)
  if (error) throw error
}

// Verify field worker access code
export async function verifyFieldWorker(code: string) {
  const { data, error } = await supabase
    .from('field_workers')
    .select('*')
    .eq('access_code', code)
    .single()
  if (error) return null
  return data
}

// Real-time subscription for dashboard
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

// Get dashboard stats
export async function getDashboardStats() {
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('district, is_bpl, is_pregnant, marital_status, total_schemes_matched, total_annual_benefit')

  if (error || !data) return null

  const stats = {
    total_registrations: data.length,
    districts: [...new Set(data.map(d => d.district))].length,
    total_matches: data.reduce((s, d) => s + (d.total_schemes_matched || 0), 0),
    total_benefit: data.reduce((s, d) => s + (d.total_annual_benefit || 0), 0),
    bpl_count: data.filter(d => d.is_bpl).length,
    pregnant_count: data.filter(d => d.is_pregnant).length,
    widow_count: data.filter(d => d.marital_status === 'widow').length,
    by_district: Object.entries(
      data.reduce((acc, d) => {
        acc[d.district] = (acc[d.district] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
  }
  return stats
}
