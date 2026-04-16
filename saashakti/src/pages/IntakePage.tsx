import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { matchSchemes, calculateTotalBenefit } from '../engine/matchSchemes'
import { saveBeneficiary, saveMatches } from '../lib/supabase'
import type { BeneficiaryProfile, FieldWorker, SchemeMatch, FormStep } from '../engine/types'
import schemesData from '../data/schemes.json'
import districts from '../data/districts-cg.json'
import { ChevronRight, ChevronLeft, Heart, Wallet, Users, AlertTriangle, User, Sparkles } from 'lucide-react'
import AnimatedBackground from '../components/3d/AnimatedBackground'
import StepIndicator3D from '../components/ui/StepIndicator3D'

interface Props {
  fieldWorker: FieldWorker | null
  onComplete: (profile: BeneficiaryProfile, matches: SchemeMatch[]) => void
}

const INITIAL: Partial<BeneficiaryProfile> = {
  gender: 'female',
  state: 'Chhattisgarh',
  residence_type: 'rural',
  caste_category: 'general',
  marital_status: 'married',
  income_bracket: 'below_1l',
  is_bpl: false,
  has_ration_card: false,
  has_bank_account: false,
  has_jan_dhan_account: false,
  owns_land: false,
  owns_pucca_house: false,
  has_lpg_connection: false,
  num_children: 0,
  is_pregnant: false,
  is_lactating: false,
  has_girl_child: false,
  is_shg_member: false,
  has_paid_maternity_leave: false,
  is_govt_psu_employee: false,
  family_is_taxpayer: false,
  family_govt_employee: false,
  family_is_elected_rep: false,
  family_is_board_chair: false,
  has_disability: false,
}

/* ------------------------------------------------------------------ */
/*  STEP META                                                         */
/* ------------------------------------------------------------------ */
const STEP_META: { icon: React.ReactNode; labelKey: string; labelEn: string }[] = [
  { icon: <User size={16} />, labelKey: 'personal_details', labelEn: 'Personal' },
  { icon: <Users size={16} />, labelKey: 'social_details', labelEn: 'Social' },
  { icon: <Wallet size={16} />, labelKey: 'economic_details', labelEn: 'Economic' },
  { icon: <Heart size={16} />, labelKey: 'family_details', labelEn: 'Family' },
  { icon: <AlertTriangle size={16} />, labelKey: 'exclusion_checks', labelEn: 'Exclusions' },
]

/* ================================================================== */
/*  Inline: Toggle                                                    */
/* ================================================================== */
function Toggle({
  label,
  value,
  onChange,
  t,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  t: (k: string) => string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200/60 last:border-b-0">
      <span className="text-base text-slate-600 pr-3 leading-snug">{label}</span>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`toggle-3d px-5 py-2.5 text-sm min-w-[56px] ${
            value ? 'toggle-3d-active' : 'toggle-3d-inactive'
          }`}
          aria-pressed={value}
        >
          {t('yes')}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`toggle-3d px-5 py-2.5 text-sm min-w-[56px] ${
            !value ? 'toggle-3d-active' : 'toggle-3d-inactive'
          }`}
          aria-pressed={!value}
        >
          {t('no')}
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Inline: OptionGrid                                                */
/* ================================================================== */
function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; icon?: React.ReactNode }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup">
      {options.map((o) => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`toggle-3d flex-col gap-1.5 py-4 px-3 option-grid-3d-item ${
              active ? 'toggle-3d-active' : 'toggle-3d-inactive'
            }`}
            role="radio"
            aria-checked={active}
          >
            {o.icon && <span className="text-lg">{o.icon}</span>}
            <span className={`text-sm font-medium leading-tight ${active ? 'text-white' : ''}`}>
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  Inline: SectionLabel -- gradient underline section header          */
/* ================================================================== */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label-3d">
      <span className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
        {children}
      </span>
      <div className="section-label-3d-underline" />
    </div>
  )
}

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */
export default function IntakePage({ fieldWorker, onComplete }: Props) {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState<FormStep>(1)
  const [form, setForm] = useState<Partial<BeneficiaryProfile>>(INITIAL)
  const [saving, setSaving] = useState(false)

  // Step transition direction tracking
  const [transitionDir, setTransitionDir] = useState<'forward' | 'backward'>('forward')
  const [transitioning, setTransitioning] = useState(false)
  const [visibleStep, setVisibleStep] = useState<FormStep>(1)
  const contentRef = useRef<HTMLDivElement>(null)

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const canProceed = () => {
    if (step === 1) return form.name && form.age && form.district
    return true
  }

  /* ---------------------------------------------------------------- */
  /*  Step change with CSS transition + scroll to top                 */
  /* ---------------------------------------------------------------- */
  const goToStep = useCallback((newStep: FormStep) => {
    if (newStep === step || transitioning) return
    const direction = newStep > step ? 'forward' : 'backward'
    setTransitionDir(direction)
    setTransitioning(true)

    // Phase 1: fade out current step
    setTimeout(() => {
      setVisibleStep(newStep)
      setStep(newStep)
      // Phase 2: incoming step slides in (handled by CSS class)
      setTimeout(() => {
        setTransitioning(false)
      }, 50) // tiny delay so the DOM re-renders with the new step before animating in
    }, 250) // exit animation duration

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, transitioning])

  // Sync visible step on mount
  useEffect(() => {
    setVisibleStep(step)
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Girl child conditional expand/collapse                          */
  /* ---------------------------------------------------------------- */
  const [girlChildExpanded, setGirlChildExpanded] = useState(!!form.has_girl_child)
  useEffect(() => {
    setGirlChildExpanded(!!form.has_girl_child)
  }, [form.has_girl_child])

  /* ---------------------------------------------------------------- */
  /*  Submit handler                                                  */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async () => {
    const profile = form as BeneficiaryProfile
    const matches = matchSchemes(profile, schemesData.schemes as any)
    const totalBenefit = calculateTotalBenefit(matches)
    profile.total_schemes_matched = matches.filter(
      (m) => m.eligibility_status === 'eligible'
    ).length
    profile.total_annual_benefit = totalBenefit

    setSaving(true)
    try {
      const saved = await saveBeneficiary({
        ...profile,
        field_worker_id: fieldWorker?.id || null,
      })
      if (saved?.id) {
        await saveMatches(
          saved.id,
          matches
            .filter(
              (m) =>
                m.eligibility_status === 'eligible' ||
                m.eligibility_status === 'partial'
            )
            .map((m) => ({
              scheme_id: m.scheme_id,
              scheme_name_hi: m.scheme.name_hi,
              scheme_name_en: m.scheme.name_en,
              benefit_amount: m.scheme.benefit.amount,
              benefit_frequency: m.scheme.benefit.frequency,
              confidence: m.eligibility_status,
            }))
        )
      }
    } catch (err) {
      console.error('Save failed:', err)
      // Continue anyway -- matching still works client-side
    }
    setSaving(false)

    onComplete(profile, matches)
    navigate('/results')
  }

  /* ---------------------------------------------------------------- */
  /*  Step labels for indicator                                       */
  /* ---------------------------------------------------------------- */
  const stepLabels = STEP_META.map((m) => t(m.labelKey) || m.labelEn)

  /* ---------------------------------------------------------------- */
  /*  Step Title Bar                                                  */
  /* ---------------------------------------------------------------- */
  const meta = STEP_META[visibleStep - 1]

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="relative min-h-screen pb-28">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Step indicator */}
        <StepIndicator3D
          currentStep={step}
          totalSteps={5}
          stepLabels={stepLabels}
        />

        {/* Step title bar */}
        <div
          className="flex items-center gap-2.5 px-5 pb-2 step-title-enter"
          key={`title-${visibleStep}`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(124,58,237,0.15))',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <span className="text-saffron-600">{meta.icon}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{t(meta.labelKey)}</h2>
        </div>

        {/* Form content with CSS transitions */}
        <div className="px-4 mt-2" ref={contentRef}>
          <div
            className={`step-transition-wrapper ${
              transitioning
                ? 'step-exit'
                : 'step-enter-active'
            } ${transitionDir === 'backward' ? 'step-dir-backward' : 'step-dir-forward'}`}
          >
            {/* ================================================== */}
            {/*  STEP 1 -- Personal Details                        */}
            {/* ================================================== */}
            {visibleStep === 1 && (
              <div className="glass-card p-5 space-y-5 page-enter">
                <SectionLabel>{t('personal_details')}</SectionLabel>

                {/* Name */}
                <div className="input-3d-wrapper animate-stagger-1">
                  <div className="relative">
                    <input
                      value={form.name || ''}
                      onChange={(e) => set('name', e.target.value)}
                      className={`input-3d peer ${form.name ? 'pt-6 pb-2' : 'pt-6 pb-2'}`}
                      placeholder=" "
                      id="field-name"
                    />
                    <label htmlFor="field-name" className={`input-3d-floating-label ${form.name ? 'input-3d-floating-label-active' : ''}`}>
                      {t('name')}
                    </label>
                  </div>
                </div>

                {/* Age */}
                <div className="input-3d-wrapper animate-stagger-2">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.age || ''}
                      onChange={(e) => set('age', parseInt(e.target.value) || 0)}
                      className={`input-3d peer pt-6 pb-2`}
                      placeholder=" "
                      min={1}
                      max={120}
                      id="field-age"
                    />
                    <label htmlFor="field-age" className={`input-3d-floating-label ${form.age ? 'input-3d-floating-label-active' : ''}`}>
                      {t('age')} ({t('years')})
                    </label>
                  </div>
                </div>

                {/* Phone */}
                <div className="input-3d-wrapper animate-stagger-3">
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      value={form.phone || ''}
                      onChange={(e) => set('phone', e.target.value)}
                      className={`input-3d peer pt-6 pb-2`}
                      placeholder=" "
                      id="field-phone"
                    />
                    <label htmlFor="field-phone" className={`input-3d-floating-label ${form.phone ? 'input-3d-floating-label-active' : ''}`}>
                      {t('phone_optional')}
                    </label>
                  </div>
                </div>

                {/* District */}
                <div className="input-3d-wrapper animate-stagger-4">
                  <label className="text-sm text-slate-600 mb-1.5 block font-medium">
                    {t('district')}
                  </label>
                  <div className="relative select-3d-wrapper">
                    <select
                      value={form.district || ''}
                      onChange={(e) => set('district', e.target.value)}
                      className="select-3d"
                    >
                      <option value="">{t('select_district')}</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {lang === 'hi' ? d.name_hi : d.name_en}
                        </option>
                      ))}
                    </select>
                    <span className="select-3d-chevron" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Residence type */}
                <div className="animate-stagger-5">
                  <label className="text-sm text-slate-600 mb-2 block font-medium">
                    {t('residence')}
                  </label>
                  <div className="flex gap-3">
                    {(['rural', 'urban'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => set('residence_type', r)}
                        className={`toggle-3d flex-1 gap-2 py-3.5 option-grid-3d-item ${
                          form.residence_type === r
                            ? 'toggle-3d-active'
                            : 'toggle-3d-inactive'
                        }`}
                      >
                        <span className="text-lg">{r === 'rural' ? '\uD83C\uDFE1' : '\uD83C\uDFD9\uFE0F'}</span>
                        <span className="font-medium">{t(r)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/*  STEP 2 -- Social Details                           */}
            {/* ================================================== */}
            {visibleStep === 2 && (
              <div className="glass-card p-5 space-y-6 page-enter">
                <SectionLabel>{t('social_details')}</SectionLabel>

                {/* Marital status */}
                <div className="animate-stagger-1">
                  <label className="text-sm text-slate-600 mb-2.5 block font-medium">
                    {t('marital_status')}
                  </label>
                  <OptionGrid
                    value={form.marital_status || 'married'}
                    onChange={(v) => set('marital_status', v)}
                    options={[
                      { key: 'married', label: t('married') },
                      { key: 'unmarried', label: t('unmarried') },
                      { key: 'widow', label: t('widow') },
                      { key: 'divorced', label: t('divorced') },
                      { key: 'deserted', label: t('deserted') },
                    ]}
                  />
                </div>

                {/* Caste category */}
                <div className="animate-stagger-2">
                  <label className="text-sm text-slate-600 mb-2.5 block font-medium">
                    {t('caste_category')}
                  </label>
                  <OptionGrid
                    value={form.caste_category || 'general'}
                    onChange={(v) => set('caste_category', v)}
                    options={[
                      { key: 'general', label: t('general') },
                      { key: 'obc', label: t('obc') },
                      { key: 'sc', label: t('sc') },
                      { key: 'st', label: t('st') },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/*  STEP 3 -- Economic Details                         */}
            {/* ================================================== */}
            {visibleStep === 3 && (
              <div className="glass-card p-5 space-y-5 page-enter">
                <SectionLabel>{t('economic_details')}</SectionLabel>

                {/* Income bracket */}
                <div className="animate-stagger-1">
                  <label className="text-sm text-slate-600 mb-2.5 block font-medium">
                    {t('income')}
                  </label>
                  <OptionGrid
                    value={form.income_bracket || 'below_1l'}
                    onChange={(v) => set('income_bracket', v)}
                    options={[
                      { key: 'below_1l', label: t('below_1l') },
                      { key: '1l_to_2l', label: t('1l_to_2l') },
                      { key: '2l_to_5l', label: t('2l_to_5l') },
                      { key: 'above_5l', label: t('above_5l') },
                    ]}
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-0 animate-stagger-2">
                  <Toggle label={t('bpl')} value={form.is_bpl || false} onChange={(v) => set('is_bpl', v)} t={t} />
                  <Toggle label={t('has_ration_card')} value={form.has_ration_card || false} onChange={(v) => set('has_ration_card', v)} t={t} />
                  <Toggle label={t('has_bank_account')} value={form.has_bank_account || false} onChange={(v) => set('has_bank_account', v)} t={t} />
                  <Toggle label={t('jan_dhan')} value={form.has_jan_dhan_account || false} onChange={(v) => set('has_jan_dhan_account', v)} t={t} />
                  <Toggle label={t('owns_land')} value={form.owns_land || false} onChange={(v) => set('owns_land', v)} t={t} />
                  <Toggle label={t('owns_house')} value={form.owns_pucca_house || false} onChange={(v) => set('owns_pucca_house', v)} t={t} />
                  <Toggle label={t('has_lpg')} value={form.has_lpg_connection || false} onChange={(v) => set('has_lpg_connection', v)} t={t} />
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/*  STEP 4 -- Family Details                           */}
            {/* ================================================== */}
            {visibleStep === 4 && (
              <div className="glass-card p-5 space-y-5 page-enter">
                <SectionLabel>{t('family_details')}</SectionLabel>

                {/* Number of children */}
                <div className="input-3d-wrapper animate-stagger-1">
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.num_children || 0}
                      onChange={(e) => set('num_children', parseInt(e.target.value) || 0)}
                      className="input-3d peer pt-6 pb-2"
                      placeholder=" "
                      min={0}
                      max={15}
                      id="field-children"
                    />
                    <label htmlFor="field-children" className={`input-3d-floating-label ${(form.num_children !== undefined && form.num_children !== null) ? 'input-3d-floating-label-active' : ''}`}>
                      {t('children')}
                    </label>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-0 animate-stagger-2">
                  <Toggle label={t('pregnant')} value={form.is_pregnant || false} onChange={(v) => set('is_pregnant', v)} t={t} />
                  <Toggle label={t('lactating')} value={form.is_lactating || false} onChange={(v) => set('is_lactating', v)} t={t} />
                  <Toggle label={t('has_girl_child')} value={form.has_girl_child || false} onChange={(v) => set('has_girl_child', v)} t={t} />

                  {/* Conditional: girl child age */}
                  <div
                    className="conditional-expand"
                    style={{
                      maxHeight: girlChildExpanded ? '120px' : '0px',
                      opacity: girlChildExpanded ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.35s ease, opacity 0.25s ease',
                    }}
                  >
                    <div className="pt-3 pb-1">
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={form.girl_child_age || ''}
                          onChange={(e) => set('girl_child_age', parseInt(e.target.value) || 0)}
                          className="input-3d peer pt-6 pb-2"
                          placeholder=" "
                          min={0}
                          max={25}
                          id="field-girl-age"
                        />
                        <label htmlFor="field-girl-age" className={`input-3d-floating-label ${form.girl_child_age ? 'input-3d-floating-label-active' : ''}`}>
                          {t('girl_child_age')}
                        </label>
                      </div>
                    </div>
                  </div>

                  <Toggle label={t('shg_member')} value={form.is_shg_member || false} onChange={(v) => set('is_shg_member', v)} t={t} />
                  <Toggle label={t('disability')} value={form.has_disability || false} onChange={(v) => set('has_disability', v)} t={t} />
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/*  STEP 5 -- Exclusion Checks                         */}
            {/* ================================================== */}
            {visibleStep === 5 && (
              <div
                className="glass-card p-5 space-y-5 page-enter"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,255,255,0.7))',
                  borderColor: 'rgba(245,158,11,0.18)',
                }}
              >
                <SectionLabel>{t('exclusion_checks')}</SectionLabel>

                {/* Warning info banner */}
                <div
                  className="rounded-xl p-3.5 flex items-start gap-3 animate-stagger-1"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.15)',
                  }}
                >
                  <AlertTriangle
                    size={20}
                    className="text-amber-400 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {lang === 'hi'
                      ? '\u0915\u0943\u092A\u092F\u093E \u092C\u0924\u093E\u090F\u0902 \u0915\u093F \u0915\u094D\u092F\u093E \u0928\u093F\u092E\u094D\u0928\u0932\u093F\u0916\u093F\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0938\u094D\u0925\u093F\u0924\u093F \u0906\u092A\u0915\u0947 \u092A\u0930\u093F\u0935\u093E\u0930 \u092A\u0930 \u0932\u093E\u0917\u0942 \u0939\u094B\u0924\u0940 \u0939\u0948:'
                      : 'Please indicate if any of the following apply to your family:'}
                  </p>
                </div>

                {/* Exclusion toggles */}
                <div className="space-y-0 animate-stagger-2">
                  <Toggle label={t('family_taxpayer')} value={form.family_is_taxpayer || false} onChange={(v) => set('family_is_taxpayer', v)} t={t} />
                  <Toggle label={t('family_govt_emp')} value={form.family_govt_employee || false} onChange={(v) => set('family_govt_employee', v)} t={t} />
                  <Toggle label={t('family_elected')} value={form.family_is_elected_rep || false} onChange={(v) => set('family_is_elected_rep', v)} t={t} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Fixed Bottom Navigation Bar                                 */}
      {/* ============================================================ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 flex gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Back button */}
        {step > 1 && (
          <button
            type="button"
            onClick={() => goToStep((step - 1) as FormStep)}
            className="btn-3d btn-3d-secondary flex items-center justify-center gap-1.5 flex-shrink-0 !w-auto px-6"
          >
            <ChevronLeft size={18} />
            <span>{t('back')}</span>
          </button>
        )}

        {/* Next / Submit button */}
        {step < 5 ? (
          <button
            type="button"
            onClick={() => goToStep((step + 1) as FormStep)}
            disabled={!canProceed()}
            className="btn-3d btn-3d-primary flex items-center justify-center gap-1.5 flex-1"
          >
            <span>{t('next')}</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-3d btn-3d-success flex items-center justify-center gap-2 flex-1"
          >
            {saving ? (
              <span className="btn-3d-spinner-wrap">
                <Sparkles size={18} className="btn-3d-spinner" />
              </span>
            ) : (
              <Sparkles size={18} />
            )}
            <span>{saving ? t('loading') : t('submit')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
