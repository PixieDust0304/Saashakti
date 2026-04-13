# SAASHAKTI — Ultra HD 3D Government-Standard Frontend Prompt

## Project Identity
**Name:** सशक्ति (Saashakti) — Women Welfare Scheme Matching Platform
**Department:** महिला एवं बाल विकास विभाग, छत्तीसगढ़ शासन
**Purpose:** AI-powered matching engine connecting 500+ women beneficiaries to 22+ government welfare schemes
**Target Users:** Field Workers (Anganwadi/ASHA workers), Beneficiary Women, District Officials, Ministers
**Event:** Ministerial Launch — April 18, 2026 — Projector Display at 1920×1080

---

## 1. DESIGN SYSTEM — Ultra HD 3D Government Standard

### 1.1 Brand Identity
| Element | Value |
|---------|-------|
| Primary: Saffron | `#F97316` (Government orange — trust, warmth) |
| Secondary: Purple | `#7C3AED` (Empowerment, dignity) |
| Accent: Gold | `#F59E0B` (Achievement, premium) |
| Success: Green | `#22C55E` (Eligibility, positive) |
| Dark Base | `#0F172A` → `#0A1929` (Navy gradient) |
| Text Primary | `#FFFFFF` at 90-100% opacity |
| Text Secondary | `#FFFFFF` at 40-60% opacity |
| Glass Surface | `rgba(255,255,255,0.04)` with `backdrop-blur: 16px` |

### 1.2 Logo
- **SVG-native logo** — Woman silhouette with upraised arms on orange→purple gradient
- Rounded-square (2xl radius) for large contexts, circular for headers
- Glow ring behind: `blur(16px)` radial gradient
- Must render crisply at 36px (header) to 96px (hero)
- Export: `SaashaktiLogo` (large) and `SaashaktiLogoMark` (compact)

### 1.3 Typography
| Context | Font | Weight | Size |
|---------|------|--------|------|
| Hindi Body (primary) | Noto Sans Devanagari | 400-700 | 14-18px |
| English Body | Inter / Manrope | 400-700 | 14-16px |
| Dashboard Counter | System / Tabular Nums | 800 | 8rem |
| Section Headings | Noto Sans Devanagari | 700 | 20-24px |
| Card Labels | Inter | 500 | 11-13px |

### 1.4 3D Visual Language
```
GLASS CARDS (every surface):
  background: rgba(255,255,255,0.04)
  backdrop-filter: blur(16px)
  border: 1px solid rgba(255,255,255,0.08)
  border-radius: 16px
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)

3D BUTTONS (primary actions):
  background: linear-gradient(180deg, <color-light>, <color-dark>)
  box-shadow: 0 4px 0 <color-darker>, 0 8px 24px rgba(0,0,0,0.3)
  transform: translateY(0)
  :active → translateY(4px), shadow shrinks (push-down 3D effect)

ANIMATED BACKGROUND:
  3 floating gradient orbs (saffron 500px, purple 600px, green 400px)
  CSS animation: orbFloat 20-30s ease-in-out infinite
  filter: blur(80-100px), opacity: 0.05-0.08
  Dotted/grid overlay at 0.015 opacity for depth
  18 micro-particles with seeded positions

ENTRANCE ANIMATIONS (CSS @keyframes — NOT framer-motion initial/animate):
  slideUp: 0→30px translateY, 0→1 opacity, 0.5s ease-out
  fadeIn: 0→1 opacity, 0.4s ease-out
  scaleIn: 0.8→1 scale, 0→1 opacity, 0.3s ease-out
  Staggered delays: 0.1s, 0.2s, 0.3s... per element
  animationFillMode: both (holds final state)

INTERACTIVE ANIMATIONS (framer-motion — only for user-triggered):
  whileHover: { y: -2, boxShadow: glow }
  whileTap: { scale: 0.97 }
  AnimatePresence: for card swaps, list updates, modal transitions
```

### 1.5 Government Standard Compliance
- **Bilingual:** Hindi-first, English toggle — every label, button, heading
- **Accessibility:** Min 4.5:1 contrast ratio, touch targets ≥44px, screen reader labels
- **Official footer:** "महिला एवं बाल विकास विभाग, छत्तीसगढ़ शासन"
- **No frivolous decoration:** Every visual element serves UX or branding purpose
- **Data privacy:** No PII displayed on dashboard projector view

---

## 2. APP WORKFLOW — Complete Clickable Flow

### 2.1 Home Page (`/`)
```
┌─────────────────────────────────────┐
│  [🌐 English]              (top-right)│
│                                       │
│         ┌──────────┐                  │
│         │  LOGO    │  ← floating      │
│         │  96×96   │     animation    │
│         └──────────┘                  │
│          सशक्ति                       │
│     हर महिला को उसका हक़              │
│                                       │
│  ┌─────────────────────────────┐     │
│  │ 🛡️ मैं फील्ड कार्यकर्ता हूँ  →│    │
│  └─────────────────────────────┘     │
│  ┌─────────────────────────────┐     │
│  │ 👤 मैं लाभार्थी हूँ          →│    │
│  └─────────────────────────────┘     │
│                                       │
│  महिला एवं बाल विकास विभाग, छ.ग.    │
└─────────────────────────────────────┘
```
**Interactions:**
- Field Worker → Glass login card slides in (AnimatePresence) → 6-digit access code → Supabase verify → Navigate `/register`
- Beneficiary → Direct navigate to `/register` (no auth)
- Language toggle → Instant switch Hindi↔English

### 2.2 Registration Form (`/register`) — 5-Step Intake
```
HEADER: [Logo 36px] सशक्ति [Field Worker Name] | [🌐 EN]

STEP INDICATOR: (1)──(2)──(3)──(4)──(5)
                 ↑ active step glows saffron

STEP 1: व्यक्तिगत जानकारी (Personal)
  - नाम (text)
  - आयु (number, 18-100)
  - मोबाइल (optional)
  - जिला (dropdown — all 28 CG districts)
  - निवास प्रकार (🏡 ग्रामीण / 🏙️ शहरी)

STEP 2: सामाजिक स्थिति (Social)
  - जाति (SC/ST/OBC/General)
  - वैवाहिक स्थिति (अविवाहित/विवाहित/विधवा/तलाकशुदा/परित्यक्ता)
  - शिक्षा स्तर (कोई नहीं/प्राथमिक/माध्यमिक/स्नातक+)
  - क्या आप विकलांग हैं? (toggle)

STEP 3: आर्थिक स्थिति (Economic)
  - बीपीएल कार्ड? (toggle)
  - वार्षिक आय (dropdown: <1L, 1-2.5L, 2.5-5L, 5L+)
  - भूमि स्वामित्व (toggle)
  - अगर हाँ → कितनी एकड़? (number)
  - रोज़गार (बेरोज़गार/दैनिक/स्व-रोज़गार/नौकरी)

STEP 4: पारिवारिक स्थिति (Family)
  - बच्चों की संख्या (number)
  - सबसे छोटे की आयु (number)
  - क्या आप गर्भवती हैं? (toggle)
  - क्या आप स्तनपान करा रही हैं? (toggle)

STEP 5: अपवर्जन (Exclusions)
  - क्या आप सरकारी कर्मचारी हैं? (toggle)
  - क्या परिवार में कोई आयकर दाता है? (toggle)

NAVIGATION: [← पीछे] ─────────── [आगे →]
STEP 5: [← पीछे] ─────────── [🔍 योजनाएं खोजें]
```

**Each step transitions with CSS slideUp animation**
**Form validation inline — red highlight on invalid fields**
**On final submit → matchSchemes() engine runs → navigate `/results`**

### 2.3 Results Page (`/results`)
```
┌─────────────────────────────────────┐
│ HEADER                               │
├─────────────────────────────────────┤
│                                       │
│  🎉 CELEBRATION CONFETTI BURST        │
│                                       │
│  ┌── HERO BENEFIT CARD ──────────┐   │
│  │  [Name], आपकी [X] योजनाएं    │   │
│  │  मिली हैं!                     │   │
│  │                                │   │
│  │  कुल वार्षिक लाभ: ₹XX,XXX    │   │
│  └────────────────────────────────┘   │
│                                       │
│  ── MATCHED SCHEMES (staggered) ──   │
│                                       │
│  ┌── SCHEME CARD ────────────────┐   │
│  │ [Badge: पूर्ण/आंशिक]          │   │
│  │ 🏛️ योजना का नाम (Hindi)       │   │
│  │    Scheme Name (English)       │   │
│  │                                │   │
│  │ 💰 लाभ: ₹X,XXX / [frequency] │   │
│  │ 📊 मिलान: 85% confidence      │   │
│  │                                │   │
│  │ ▼ विवरण देखें (expandable)    │   │
│  │   ├─ पात्रता मानदंड (met ✅)  │   │
│  │   ├─ आवश्यक दस्तावेज          │   │
│  │   ├─ आवेदन प्रक्रिया          │   │
│  │   ├─ अगला कदम                  │   │
│  │   └─ आधिकारिक लिंक 🔗        │   │
│  └────────────────────────────────┘   │
│                                       │
│  [Repeat for each matched scheme]     │
│                                       │
│  ┌── FIELD WORKER BAR ───────────┐   │
│  │ [अगला पंजीकरण] [💾 Save&Print]│   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2.4 Live Dashboard (`/dashboard`) — 1920×1080 Projector
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] सशक्ति — Saashakti                    🟢 LIVE        │
│ महिला कल्याण योजना मिलान मंच                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              कुल पंजीकृत महिलाएं                              │
│                   ███                                         │
│                   ███  ← 8rem animated counter                │
│                   ███                                         │
│              महिलाएं पंजीकृत                                  │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │📍 XX    │ │🏆 XXX   │ │₹ XX.XL  │ │📈 X.X   │           │
│  │जिले     │ │योजना    │ │वार्षिक  │ │औसत     │           │
│  │कवर     │ │मिलान    │ │लाभ     │ │योजना   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                                 │
│  │🛡️ XX │ │👶 XX │ │💜 XX │                                 │
│  │बीपीएल│ │गर्भवती│ │विधवा│                                 │
│  └──────┘ └──────┘ └──────┘                                 │
│                                                               │
│  ┌── DISTRICT BAR CHART ────────────────────────────────┐   │
│  │ रायपुर    ████████████████████ 45                     │   │
│  │ दुर्ग     ██████████████ 32                           │   │
│  │ बिलासपुर  █████████ 21                                │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌── TOP SCHEMES ──────┐ ┌── RECENT REGISTRATIONS ────┐    │
│  │ 1. प्रधानमंत्री...   │ │ रीता - रायपुर - 2 मिनट    │    │
│  │ 2. लाडली लक्ष्मी    │ │ सुनीता - दुर्ग - 5 मिनट   │    │
│  │ 3. कन्या विवाह...   │ │ प्रिया - बिलासपुर - 8 मिनट│    │
│  └──────────────────────┘ └────────────────────────────┘    │
│                                                               │
│  महिला एवं बाल विकास विभाग, छत्तीसगढ़ शासन • Saashakti     │
└─────────────────────────────────────────────────────────────┘

REAL-TIME FEATURES:
  - Supabase postgres_changes subscription → debounced refetch (2s)
  - Polling every 8 seconds as fallback
  - Counter pulse animation on new registration
  - Live dot with CSS pulse animation
  - AnimatePresence for recent registration list items
```

---

## 3. SCHEME DATABASE — Complete Details per Scheme

### 3.1 Scheme Card Structure (TypeScript)
```typescript
interface Scheme {
  id: string
  name_hi: string                    // Hindi name
  name_en: string                    // English name
  department: string                 // Issuing department
  category: string                   // 'central' | 'state' | 'district'

  // Benefit Details
  benefit_amount: number | null      // ₹ amount
  benefit_frequency: string          // 'monthly' | 'yearly' | 'one-time' | 'as-needed'
  benefit_type: string               // 'cash' | 'kind' | 'service' | 'subsidy'
  benefit_description_hi: string     // Detailed benefit description

  // Eligibility (complete clickable details)
  eligibility_criteria: {
    age_min?: number
    age_max?: number
    gender: 'female' | 'any'
    marital_status?: string[]
    caste?: string[]
    is_bpl?: boolean
    max_income?: number
    is_pregnant?: boolean
    is_lactating?: boolean
    min_children?: number
    is_disabled?: boolean
    residence_type?: 'rural' | 'urban' | 'any'
    state: string
  }

  // Documents Required
  documents_required: string[]       // ['आधार कार्ड', 'बीपीएल कार्ड', ...]

  // Application Process
  application_process_hi: string     // Step-by-step in Hindi
  application_url?: string           // Official portal link
  helpline?: string                  // Toll-free number

  // Auto-fetch metadata
  source_url: string                 // Government gazette/portal URL
  last_updated: string               // ISO date
  is_active: boolean                 // Scheme still accepting applications

  // Display
  icon: string                       // Emoji or icon name
  color: string                      // Card accent color
}
```

### 3.2 All 22+ Schemes with Complete Details

Each scheme card must show when expanded:

```
┌── SCHEME DETAIL VIEW (expandable) ──────────────────┐
│                                                       │
│  🏛️ [Scheme Name Hindi]                              │
│     [Scheme Name English]                            │
│     [Department] • [Category Badge: केंद्र/राज्य]    │
│                                                       │
│  ── पात्रता मानदंड (Eligibility) ──                  │
│  ✅ आयु: 18-45 वर्ष                                  │
│  ✅ जाति: SC/ST                                      │
│  ✅ बीपीएल कार्डधारक                                 │
│  ❌ आय: ₹2.5 लाख से अधिक (not met)                  │
│                                                       │
│  ── लाभ विवरण (Benefit Details) ──                   │
│  💰 राशि: ₹1,500/माह                                │
│  📅 अवधि: मासिक                                     │
│  📝 विवरण: गर्भावस्था के दौरान पोषण सहायता...       │
│                                                       │
│  ── आवश्यक दस्तावेज़ (Documents) ──                  │
│  📄 आधार कार्ड                                       │
│  📄 बीपीएल प्रमाण पत्र                               │
│  📄 बैंक पासबुक                                      │
│  📄 गर्भावस्था प्रमाण पत्र                           │
│                                                       │
│  ── आवेदन प्रक्रिया (How to Apply) ──                │
│  1️⃣ नज़दीकी आंगनवाड़ी केंद्र जाएं                   │
│  2️⃣ फॉर्म भरें और दस्तावेज़ जमा करें                │
│  3️⃣ सत्यापन के बाद लाभ बैंक खाते में               │
│                                                       │
│  ── अगला कदम (Next Steps) ──                         │
│  🔗 आधिकारिक पोर्टल: [clickable link]               │
│  📞 हेल्पलाइन: 1800-XXX-XXXX                        │
│  📍 नज़दीकी कार्यालय: [district office]              │
│                                                       │
│  ── अंतिम अपडेट ──                                   │
│  🕐 Last verified: [date] from [source_url]          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 3.3 Auto-Fetch Latest Scheme Data

```
STRATEGY: Hybrid — Static DB + Periodic Sync + Manual Override

DATA SOURCES:
1. MyScheme.gov.in API (if available)
2. CG State Portal scraping (scheduled)
3. Manual admin entry via Supabase dashboard

IMPLEMENTATION:
  ┌─ Supabase Tables ──────────────────┐
  │                                     │
  │ schemes                             │
  │   ├─ id, name_hi, name_en          │
  │   ├─ benefit_amount, frequency      │
  │   ├─ eligibility (JSONB)            │
  │   ├─ documents (text[])             │
  │   ├─ application_process_hi         │
  │   ├─ source_url, last_verified      │
  │   ├─ is_active, updated_at          │
  │   └─ auto_fetch_enabled             │
  │                                     │
  │ scheme_updates                      │
  │   ├─ scheme_id, field_changed       │
  │   ├─ old_value, new_value           │
  │   └─ detected_at, applied_at        │
  └─────────────────────────────────────┘

AUTO-FETCH FLOW:
  1. Supabase Edge Function runs daily (CRON)
  2. Fetches from government source URLs
  3. Compares with stored data
  4. Creates scheme_updates record for changes
  5. Admin reviews and approves
  6. Client-side: check schemes.updated_at on app load
  7. Show "🔄 नई जानकारी उपलब्ध" badge if newer than cache

CLIENT CACHE:
  - Store schemes in localStorage with timestamp
  - Compare with server updated_at on each session
  - Background refresh while user fills form
  - Never block user flow for data sync
```

---

## 4. GENERATED IMAGES & GRAPHICS

### 4.1 Required Visual Assets (Generate via Figma/Canva/Magic AI)

| Asset | Dimensions | Purpose | Style |
|-------|-----------|---------|-------|
| Logo (SVG) | Scalable | App icon, headers | Orange→Purple gradient, woman silhouette |
| Splash Screen | 1080×1920 | PWA loading | Dark navy, logo center, particle field |
| Dashboard BG | 1920×1080 | Projector background | Dark gradient with floating orbs |
| Scheme Category Icons | 64×64 each | Card headers | 3D glass-style, matching accent color |
| Step Icons (5) | 48×48 | Form steps | Outlined, white on glass |
| Success Celebration | 400×400 | Results page | Confetti/sparkle burst animation |
| Empty State | 300×300 | No data states | Soft illustration, woman + search |
| Error State | 300×300 | Connection errors | Soft illustration, retry arrow |
| OG Image | 1200×630 | Social sharing | Logo + tagline + gradient |
| Favicon | 32×32, 192×192 | Browser tab, PWA | Logo mark on transparent |

### 4.2 Figma Component Library

```
FIGMA STRUCTURE:
📂 Saashakti Design System
├── 🎨 Colors & Tokens
│   ├── Brand Colors (saffron, purple, gold)
│   ├── Surface Colors (glass, dark variants)
│   ├── Semantic Colors (success, error, warning)
│   └── Gradient Definitions
│
├── 📝 Typography
│   ├── Hindi Heading Styles
│   ├── English Body Styles
│   └── Counter / Metric Styles
│
├── 🧱 Components
│   ├── Glass Card (variants: default, hover, active)
│   ├── 3D Button (variants: primary, secondary, success, purple)
│   ├── Input Field (3D inset)
│   ├── Toggle Switch (3D)
│   ├── Option Grid (selectable cards)
│   ├── Step Indicator
│   ├── Progress Bar
│   ├── Metric Card (with colored border)
│   ├── Scheme Card (collapsed + expanded)
│   ├── Badge (eligible, partial, ineligible)
│   └── Logo (large, mark, header)
│
├── 📱 Screens
│   ├── Home Page (hero + buttons)
│   ├── Registration Steps 1-5
│   ├── Results Page (hero + scheme cards)
│   └── Dashboard (1920×1080)
│
└── 🎭 Illustrations
    ├── Woman Empowerment Silhouette
    ├── Celebration/Success
    ├── Empty States
    └── Government Seal/Watermark
```

### 4.3 Canva/Magic AI Generation Prompts

**Logo Generation:**
```
"Minimalist government app logo, Indian woman silhouette with raised arms symbolizing
empowerment, gradient from saffron orange (#F97316) to royal purple (#7C3AED), rounded
square icon, white silhouette on gradient background, clean vector style, no text,
premium quality, suitable for government application"
```

**Dashboard Background:**
```
"Ultra dark navy blue (#0A1929) abstract background for government data dashboard,
subtle floating gradient orbs in saffron and purple, faint geometric grid overlay,
cinematic depth of field, 8K quality, no text, suitable for 1920x1080 projector display"
```

**Scheme Category Icons:**
```
"Set of 6 glassmorphism-style icons for Indian government welfare schemes:
health/medical, education, financial aid, housing, nutrition, skill development.
Dark glass background, white icon outlines, subtle gradient glow, 64x64px,
consistent style, premium 3D appearance"
```

**Success Celebration:**
```
"Festive celebration illustration for Indian women welfare app, confetti in saffron
and purple colors, sparkles, achievement/success theme, transparent background,
flat vector with subtle 3D depth, joyful energy, culturally appropriate"
```

---

## 5. TECH STACK & ARCHITECTURE

```
FRONTEND:
  React 18 + TypeScript + Vite 5
  Tailwind CSS 3 (custom 3D design system)
  Framer Motion (interactive only: hover, tap, AnimatePresence)
  CSS @keyframes (entrance animations — reliable regardless of tab visibility)
  Lucide React (icons)

BACKEND:
  Supabase (PostgreSQL + Realtime + Edge Functions + Auth)

PWA:
  vite-plugin-pwa
  Service Worker for offline form caching
  Manifest with splash screens

MATCHING ENGINE:
  Client-side TypeScript (matchSchemes.ts)
  18+ eligibility criteria checks
  Confidence scoring (policy + data)
  Hindi/English dual explanations

DATA FLOW:
  1. User fills form (5 steps) → BeneficiaryProfile object
  2. matchSchemes(profile) → SchemeMatch[] with scores
  3. saveBeneficiary(profile) → Supabase INSERT
  4. saveMatches(beneficiaryId, matches) → Supabase INSERT
  5. Dashboard subscribes to realtime changes
  6. Auto-fetch checks scheme freshness on app load
```

---

## 6. RESPONSIVE BREAKPOINTS

| Context | Width | Priority |
|---------|-------|----------|
| Budget Phone (field) | 320-414px | **PRIMARY** — all form flows |
| Standard Mobile | 414-768px | Enhanced spacing |
| Tablet | 768-1024px | 2-column layouts |
| Dashboard (projector) | 1920×1080 | **CRITICAL** — single-screen, no scroll |

---

## 7. PERFORMANCE REQUIREMENTS

- First Contentful Paint: < 1.5s on 3G
- Time to Interactive: < 3s
- Bundle Size: < 200KB gzipped
- Lighthouse Score: > 90 (Performance, Accessibility, PWA)
- CSS animations over JS animations for entrance effects
- Lazy load dashboard page (not needed on mobile)
- Image optimization: SVG for icons/logo, WebP for photos
- Service worker: cache Tailwind CSS + fonts + app shell

---

## 8. ACCESSIBILITY & GOVERNMENT COMPLIANCE

- WCAG 2.1 AA compliant
- Hindi screen reader support (aria-labels in Hindi)
- Touch targets minimum 44×44px
- Form fields with proper label associations
- Error messages both visual (red) and announced
- No auto-playing audio/video
- Print-friendly results page for scheme cards
- Works without JavaScript for basic content viewing
- No external tracking scripts (government privacy policy)
