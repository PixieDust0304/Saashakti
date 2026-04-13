# SAASHAKTI — Multi-Agent Design Production Prompt
## Ultra HD 3D Rendered Government UI — Agent Task Assignment

---

## PROJECT BRIEF

**App:** सशक्ति (Saashakti) — Women Welfare Scheme Matching Platform
**Client:** महिला एवं बाल विकास विभाग, छत्तीसगढ़ शासन
**Deadline:** April 18, 2026 — Ministerial Launch Event
**Output:** PWA (Mobile-first) + Dashboard (1920x1080 Projector)
**Theme:** Light/White with Saffron #F97316 + Purple #7C3AED brand
**Stack:** React 18 + TypeScript + Tailwind CSS + Framer Motion

---

## AGENT ROSTER

| Agent ID | Role | Tools | Deliverables |
|----------|------|-------|-------------|
| **AGENT-1** | Logo & Brand Identity Designer | Figma, Canva AI, Adobe Illustrator | Logo suite, brand kit, favicon set |
| **AGENT-2** | 3D UI Component Designer | Figma, Pomelli, Google Stitch | Component library, 3D card renders |
| **AGENT-3** | Illustration & Icon Artist | Canva Magic AI, Midjourney, DALL-E | Scheme icons, empty states, celebrations |
| **AGENT-4** | Screen Layout & UX Designer | Figma, Canva Docs | All 8+ screen wireframes and hi-fi mockups |
| **AGENT-5** | Dashboard & Data Viz Specialist | Figma, Google Stitch, Canva Charts | 1920x1080 dashboard layout, chart styles |
| **AGENT-6** | Motion & Interaction Designer | Figma Prototyping, Lottie | Transition specs, micro-interactions, loading states |
| **AGENT-7** | Asset Export & Dev Handoff | Figma Dev Mode, Zeplin | CSS tokens, SVG exports, responsive specs |
| **AGENT-QC** | Quality Check Monitor & Integrator | All tools (read-only) + Review Checklist | Final approval, consistency audit, merge |

---

## AGENT-1: Logo & Brand Identity Designer

### Task 1.1 — Primary Logo (Figma + Canva AI)

**Figma Prompt:**
```
Create a logo for "सशक्ति (Saashakti)" — a government women empowerment app.

CONCEPT:
- Indian woman silhouette with upraised arms symbolizing strength and empowerment
- Clean, modern, minimal — suitable for government use
- Must work at 32px (favicon) to 512px (splash screen)

SHAPE:
- Rounded square (24px radius at 96px size) for app icon variant
- Circular crop for header/compact variant
- Full horizontal lockup for splash: [Icon] + "सशक्ति" text

COLOR:
- Background gradient: #F97316 (saffron) → #9333EA → #7C3AED (purple), 135deg
- Silhouette: white at 90-95% opacity
- Glow ring behind icon: 16px blur, gradient matching background at 30% opacity

STYLE:
- Vector SVG — no raster elements
- Woman figure: head circle + body line + upraised arms + flowing skirt
- 3-4 energy/empowerment dots floating around figure
- Hair strands flowing to suggest movement

EXPORT VARIANTS:
1. logo-icon-96.svg (rounded square, icon only)
2. logo-icon-512.svg (rounded square, icon only, high-res)
3. logo-mark-36.svg (circular, compact for headers)
4. logo-lockup-horizontal.svg (icon + "सशक्ति" text)
5. logo-favicon-32.png (circular, simplified)
6. logo-og-1200x630.png (social sharing with tagline)
```

**Canva AI Prompt:**
```
Generate a professional government app logo:
"Indian woman empowerment symbol, raised arms, saffron orange to purple gradient
background, white silhouette, rounded square shape, clean minimal vector style,
no text in the icon, suitable for mobile app icon, premium 3D glass appearance,
government-grade professional quality"
```

### Task 1.2 — Brand Kit Document (Canva)

```
Create a 1-page brand guideline card:
- Logo usage: minimum size, clear space, do/don't
- Color palette: Primary (#F97316), Secondary (#7C3AED), Accent (#F59E0B),
  Success (#22C55E), Background (#F8FAFC), Text (#0F172A)
- Typography: Noto Sans Devanagari (Hindi), Inter (English)
- Gradient specs: 135deg saffron→purple for brand elements
- Government seal placement rules
```

### Task 1.3 — Favicon & PWA Icons

```
Export from the primary logo:
- favicon.ico (16x16, 32x32 multi-resolution)
- apple-touch-icon.png (180x180)
- icon-192.png (PWA manifest)
- icon-512.png (PWA manifest)
- maskable-icon-512.png (with safe zone padding)
All on transparent background except maskable (use gradient bg)
```

---

## AGENT-2: 3D UI Component Designer

### Task 2.1 — Glass Card System (Figma + Pomelli)

**Figma Component Specs:**
```
COMPONENT: GlassCard
VARIANTS: default, hover, active, saffron, purple, success

DEFAULT STATE:
  Background: white at 75% opacity
  Border: 1px solid rgba(0,0,0,0.06)
  Border-radius: 20px
  Shadow: 0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)
  Top highlight: 1px gradient line (transparent → white → transparent)

HOVER STATE:
  Transform: translateY(-4px) scale(1.01)
  Shadow: 0 20px 48px rgba(0,0,0,0.1)
  Border glow: 1px rgba(249,115,22,0.25)

SAFFRON VARIANT:
  Background: linear-gradient(135deg, rgba(249,115,22,0.08), rgba(249,115,22,0.02))
  Left border accent: 4px solid #F97316

PURPLE VARIANT:
  Background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))
  Left border accent: 4px solid #7C3AED
```

**Pomelli 3D Render Prompt:**
```
Render a frosted glass card UI component for a mobile app.
White/clear glass material, subtle refraction, soft shadow underneath.
Rounded corners (20px). Light source from top-left.
Show the card floating 4px above a light cream background.
Card dimensions: 350x120px. Premium, clean, Apple-quality aesthetic.
```

### Task 2.2 — 3D Button System (Figma + Google Stitch)

**Figma Component Specs:**
```
COMPONENT: Button3D
VARIANTS: primary, secondary, success, purple
STATES: default, hover, active/pressed, disabled

PRIMARY (Saffron):
  Default:
    Background: linear-gradient(135deg, #F97316, #EA580C)
    Shadow: 0 4px 0 #C2410C, 0 8px 24px rgba(249,115,22,0.25)
    Text: white, 18px, semibold
    Padding: 14px 24px
    Border-radius: 16px
    Inner highlight: inset 0 1px 0 rgba(255,255,255,0.2)

  Pressed:
    Transform: translateY(3px)
    Shadow: 0 1px 0 #C2410C (flat — "pushed in" 3D effect)

  Hover:
    Shadow expands: 0 12px 32px rgba(249,115,22,0.35)
    Outer glow: 0 0 40px rgba(249,115,22,0.12)

SECONDARY (Glass):
    Background: white at 80%
    Border: 2px solid rgba(0,0,0,0.08)
    Text: #334155 (slate-700)
    Shadow: 0 4px 0 rgba(0,0,0,0.06)
```

**Google Stitch Prompt:**
```
Create a set of 3D rendered mobile app buttons with push-down effect.
Orange gradient button (saffron), purple gradient button, white glass button.
Each shown in 3 states: normal, hover (lifted), pressed (pushed down).
Light background, soft shadows, premium government app aesthetic.
Hindi text on buttons: "आगे", "खोजें", "सहेजें"
```

### Task 2.3 — Form Input Components (Figma)

```
COMPONENT: Input3D
VARIANTS: text, number, select, toggle

TEXT INPUT:
  Background: white at 90%
  Border: 2px solid rgba(0,0,0,0.08)
  Inner shadow: inset 0 2px 4px rgba(0,0,0,0.04)
  Border-radius: 12px
  Padding: 14px 16px
  Text: #0F172A, 18px
  Placeholder: rgba(0,0,0,0.3)
  Focus: border #F97316 at 50%, outer ring 3px rgba(249,115,22,0.1)

TOGGLE (Yes/No):
  Active: saffron gradient with 3D push shadow
  Inactive: white glass with subtle inset shadow
  Size: flex-1, 48px height minimum

SELECT DROPDOWN:
  Same as text input + chevron icon right-aligned
  Options panel: white, elevated shadow
```

### Task 2.4 — Step Indicator (Figma)

```
COMPONENT: StepIndicator3D
PROPS: totalSteps=5, currentStep=1-5

LAYOUT: horizontal row of circles connected by lines

ACTIVE STEP:
  Background: gradient #F97316 → #7C3AED
  Glow ring: 4px rgba(249,115,22,0.15)
  Shadow: 0 4px 16px rgba(249,115,22,0.3)
  Scale: 1.15x
  Number: white, bold

COMPLETED STEP:
  Background: gradient #138808 → #0D6E04
  Checkmark icon (white)
  Shadow: 0 3px 12px rgba(19,136,8,0.25)

PENDING STEP:
  Background: white at 80%
  Border: 2px solid rgba(0,0,0,0.1)
  Number: rgba(0,0,0,0.3)

CONNECTOR LINE:
  Pending: rgba(0,0,0,0.06), 2px height
  Done: gradient #138808 → #F97316
```

---

## AGENT-3: Illustration & Icon Artist

### Task 3.1 — Scheme Category Icons (Canva Magic AI)

```
Generate 8 scheme category icons, each 64x64px:

1. HEALTH/MEDICAL — stethoscope + heart
   "Minimal line icon, stethoscope with heart, saffron orange accent,
   white background with subtle glass effect, 64px, government style"

2. EDUCATION — book + graduation cap
   "Minimal line icon, open book with graduation cap, purple accent,
   white glass background, 64px, clean professional"

3. FINANCIAL AID — rupee symbol + hands
   "Minimal line icon, Indian rupee symbol with supporting hands,
   saffron orange, white glass background, 64px"

4. NUTRITION — bowl + spoon + leaf
   "Minimal line icon, food bowl with leaf, green accent #22C55E,
   white glass, 64px, maternal nutrition theme"

5. HOUSING — house + family
   "Minimal line icon, house outline with family silhouette,
   blue accent #3B82F6, white glass, 64px"

6. SKILL DEVELOPMENT — tools + upward arrow
   "Minimal line icon, tools with upward growth arrow,
   purple accent #7C3AED, white glass, 64px"

7. CHILD WELFARE — baby + shield
   "Minimal line icon, baby with protective shield,
   pink accent #EC4899, white glass, 64px"

8. WIDOW SUPPORT — woman + supporting hand
   "Minimal line icon, woman figure with compassionate hand,
   purple accent #8B5CF6, white glass, 64px"

STYLE CONSISTENCY:
- All icons use 2px stroke weight
- Same border-radius (12px) on glass background
- Matching shadow depth
- Export as SVG (scalable) and PNG @2x
```

### Task 3.2 — Empty State Illustrations (Canva Magic AI)

```
Generate 3 empty state illustrations, each 300x300px:

1. NO DATA — woman looking through magnifying glass
   "Soft pastel illustration, Indian woman in saree looking through
   magnifying glass searching, saffron and purple tones, white
   background, friendly helpful mood, minimal flat style with
   subtle depth, no text"

2. CONNECTION ERROR — broken wifi with retry
   "Soft pastel illustration, disconnected signal waves with a
   circular retry arrow, saffron orange tones, concerned but
   hopeful mood, minimal flat style, no text"

3. LOADING/PROCESSING — gears turning with sparkles
   "Soft pastel illustration, interlocking gears with sparkle
   effects, saffron and purple gradient tones, progress/movement
   feeling, minimal style, no text"
```

### Task 3.3 — Success Celebration Assets

```
1. CONFETTI BURST — for results page
   "Festive confetti explosion, saffron orange and purple pieces,
   gold sparkles, transparent background, top-down burst pattern,
   celebration mood, 400x400px PNG with alpha"

2. ACHIEVEMENT BADGE — for scheme match count
   "Government-style achievement badge, gold ring, saffron center,
   star accent, premium 3D render, transparent background,
   128x128px, suitable for overlay"

3. CELEBRATION LOTTIE — animated confetti
   "Create a 3-second Lottie animation: confetti pieces falling
   from top, saffron/purple/gold colors, gentle float physics,
   fade out at bottom, looping: false"
```

---

## AGENT-4: Screen Layout & UX Designer

### Task 4.1 — Home Page (Figma Hi-Fi Mockup)

```
DEVICE: iPhone 14 frame (390x844)
BACKGROUND: Light gradient (#F8FAFC → #EFF6FF → #FFF7ED)

LAYOUT (top to bottom):
  [16px top padding]

  TOP-RIGHT: Language toggle pill
    "English" / "हिंदी" in glass pill button

  CENTER (vertically centered):
    Logo icon (96x96) with glow ring + floating animation hint
    ↕ 12px
    "सशक्ति" — 30px bold, slate-900
    ↕ 4px
    "हर महिला को उसका हक़" — 18px, saffron-500
    ↕ 40px

    BUTTON 1: "मैं फील्ड कार्यकर्ता हूँ"
      Glass card, saffron-tinted, shield icon left, arrow right
      Full width (with 24px side padding)
    ↕ 16px
    BUTTON 2: "मैं लाभार्थी हूँ"
      Glass card, purple-tinted, user icon left, arrow right
      Full width

  BOTTOM:
    "महिला एवं बाल विकास विभाग, छत्तीसगढ़" — 12px, slate-400

INTERACTIONS TO PROTOTYPE:
  - Tap "Field Worker" → slide-in login card (AnimatePresence)
  - Tap "Beneficiary" → navigate to /register
  - Tap language → instant text swap
  - Login card: 6-digit input → verify button → loading spinner
```

### Task 4.2 — Registration Form — 5 Screens (Figma)

```
SCREEN: /register (5 step variations)

HEADER (sticky, 60px):
  [Logo 36px] [App Name saffron] ——————— [EN toggle]

STEP INDICATOR (below header):
  5 circles connected by lines (see Agent-2 Task 2.4)

STEP TITLE:
  [Gradient icon box] "Step Name in Hindi" — 20px bold

FORM AREA (scrollable):
  Glass card container with form fields inside

BOTTOM (fixed):
  [← पीछे (secondary)] ——— [आगे → (primary 3D button)]
  Step 5: [← पीछे] ——— [🔍 योजनाएं खोजें (success 3D button)]

--- STEP 1: व्यक्तिगत जानकारी ---
Fields:
  नाम → text input (input-3d)
  आयु (वर्ष) → number input
  मोबाइल नंबर (वैकल्पिक) → tel input
  जिला → select dropdown (28 CG districts)
  निवास प्रकार → toggle pair (🏡 ग्रामीण / 🏙️ शहरी)

--- STEP 2: सामाजिक स्थिति ---
Fields:
  जाति → option grid (SC / ST / OBC / सामान्य)
  वैवाहिक स्थिति → option grid (5 options)
  शिक्षा स्तर → option grid (4 options)
  क्या आप विकलांग हैं? → toggle (हाँ / नहीं)

--- STEP 3: आर्थिक स्थिति ---
Fields:
  बीपीएल कार्ड → toggle
  वार्षिक आय → option grid (4 brackets)
  भूमि स्वामित्व → toggle
  [if yes] कितनी एकड़ → number input
  रोज़गार → option grid (4 options)

--- STEP 4: पारिवारिक स्थिति ---
Fields:
  बच्चों की संख्या → number input
  सबसे छोटे की आयु → number input
  क्या आप गर्भवती हैं? → toggle
  क्या आप स्तनपान करा रही हैं? → toggle

--- STEP 5: अपवर्जन जाँच ---
Fields:
  सरकारी कर्मचारी? → toggle
  परिवार में आयकर दाता? → toggle
  [info box] "यह जानकारी योजना पात्रता निर्धारण के लिए है"
```

### Task 4.3 — Results Page (Figma)

```
HEADER: same as registration

HERO CARD (glass, saffron-tinted):
  "[Name], आपकी [X] योजनाएं मिली हैं!"
  "कुल वार्षिक लाभ: ₹XX,XXX"
  Confetti celebration overlay on load

SCHEME CARDS (stacked, scrollable):
  Each card:
    [Badge: ✅ पूर्ण पात्र / ⚠️ आंशिक]
    Scheme name (Hindi, bold, 18px)
    Scheme name (English, 14px, slate-400)
    Department + Category badge (केंद्र/राज्य)
    ↕
    💰 ₹X,XXX / [monthly/yearly/one-time]
    📊 Confidence: XX%
    ↕
    ▼ "विवरण देखें" (expandable section)
      ├── पात्रता मानदंड (✅/❌ for each criterion)
      ├── आवश्यक दस्तावेज़ (📄 list)
      ├── आवेदन प्रक्रिया (numbered steps)
      ├── अगला कदम (next best action)
      └── 🔗 आधिकारिक पोर्टल | 📞 हेल्पलाइन

FIELD WORKER BAR (bottom, fixed):
  [अगला पंजीकरण] [💾 सहेजें और प्रिंट करें]
```

### Task 4.4 — Scheme Detail Expanded View (Figma)

```
FULL DETAIL VIEW (when "विवरण देखें" is expanded):

┌── SCHEME DETAIL ─────────────────────────┐
│                                           │
│  🏛️ प्रधानमंत्री मातृ वंदना योजना        │
│     Pradhan Mantri Matru Vandana Yojana  │
│     [केंद्र] स्वास्थ्य एवं परिवार कल्याण  │
│                                           │
│  ── पात्रता ────────────────────────────  │
│  ✅ लिंग: महिला                           │
│  ✅ आयु: 19+ वर्ष                        │
│  ✅ गर्भवती/स्तनपान कराने वाली           │
│  ❌ पहला जीवित बच्चा (not met)           │
│                                           │
│  ── लाभ विवरण ──────────────────────────  │
│  💰 ₹5,000 (एकमुश्त, 3 किस्तों में)     │
│  📅 गर्भावस्था के दौरान                  │
│  📝 पोषण सहायता एवं वेतन हानि की        │
│     आंशिक क्षतिपूर्ति                    │
│                                           │
│  ── दस्तावेज़ ──────────────────────────  │
│  📄 आधार कार्ड                           │
│  📄 बैंक पासबुक (DBT के लिए)            │
│  📄 MCP कार्ड / गर्भावस्था प्रमाण       │
│  📄 बीपीएल प्रमाण पत्र (यदि लागू)      │
│                                           │
│  ── आवेदन प्रक्रिया ───────────────────  │
│  1️⃣ नज़दीकी आंगनवाड़ी केंद्र जाएं       │
│  2️⃣ AWW/ASHA कार्यकर्ता से फॉर्म लें    │
│  3️⃣ दस्तावेज़ सहित फॉर्म जमा करें      │
│  4️⃣ सत्यापन → बैंक खाते में राशि        │
│                                           │
│  ── संपर्क ─────────────────────────────  │
│  🔗 pmmvy.wcd.gov.in                     │
│  📞 181 (Women Helpline)                  │
│  📍 नज़दीकी AWC: [auto from district]    │
│                                           │
│  ── अपडेट ──────────────────────────────  │
│  🕐 Last verified: 2026-04-10             │
│  📌 Source: wcd.nic.in                    │
│  🔄 Auto-fetch: Enabled                  │
└───────────────────────────────────────────┘

DESIGN NOTES:
- Each section separated by subtle 1px divider
- Met criteria: green check + green-tinted text
- Unmet criteria: red X + muted text
- Links are saffron-colored, underlined on hover
- Phone numbers are tel: links (tap to call)
- "Auto-fetch" badge shows freshness indicator
```

---

## AGENT-5: Dashboard & Data Viz Specialist

### Task 5.1 — Dashboard Full Layout (Figma, 1920x1080)

```
CANVAS: exactly 1920x1080px (projector resolution)
BACKGROUND: light gradient (#F8FAFC → #EFF6FF → #FFF7ED)
NO SCROLLING — everything must fit in one screen

LAYOUT:
┌─────────────────────────────────────────────────────┐
│ HEADER BAR (64px)                                    │
│ [Logo 48px] सशक्ति — Saashakti        🟢 LIVE       │
│ महिला कल्याण योजना मिलान मंच                        │
├─────────────────────────────────────────────────────┤
│                                                       │
│  HERO COUNTER (center, ~200px height)                │
│  "कुल पंजीकृत महिलाएं"                              │
│  [XXX] ← 128px font, animated counter               │
│  "महिलाएं पंजीकृत"                                  │
│                                                       │
│  4 METRIC CARDS (grid, equal width, ~100px height)   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │📍 XX   │ │🏆 XXX  │ │₹ XX.XL │ │📈 X.X  │       │
│  │जिले    │ │योजना   │ │लाभ    │ │औसत    │       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                       │
│  3 DEMOGRAPHIC PILLS (grid, ~60px height)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │🛡️ XX बीपीएल│ │👶 XX गर्भवती│ │💜 XX विधवा│       │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                       │
│  DISTRICT BAR CHART (~180px height)                  │
│  Horizontal bars, top 8 districts, gradient fill     │
│                                                       │
│  BOTTOM SPLIT (2 columns, ~160px height)             │
│  ┌── TOP SCHEMES ────┐ ┌── RECENT REGS ──────┐     │
│  │ ranked list        │ │ live feed with       │     │
│  │ with progress bars │ │ name, district, time │     │
│  └────────────────────┘ └──────────────────────┘     │
│                                                       │
│  FOOTER (24px)                                        │
│  महिला एवं बाल विकास विभाग, छत्तीसगढ़ शासन          │
└─────────────────────────────────────────────────────┘
```

**Google Stitch Prompt:**
```
Create a professional government data dashboard for women welfare scheme
matching platform. 1920x1080 resolution for projector display.
Light white/cream background with subtle warm gradient.
Glass-morphism cards with white frosted glass effect.
Saffron orange and purple accent colors.
Hindi text for labels.
Include: large center counter, 4 KPI metric cards, bar chart,
two bottom panels (ranked list + live feed).
Clean, modern, premium government aesthetic.
```

### Task 5.2 — Chart Styles (Figma)

```
DISTRICT BAR CHART:
  - Horizontal bars
  - Gradient fill: #F97316 → #FB923C
  - Background track: #F1F5F9 (slate-100)
  - District labels: right-aligned, saffron-700
  - Count labels: inside bar, right-aligned, slate-800
  - Bar height: 20px with 6px gap
  - Border-radius: 4px
  - Max 8 bars visible

SCHEME PROGRESS BARS:
  - Thin (6px height)
  - Gradient fill: #22C55E → #4ADE80
  - Background: slate-100
  - Full rounded

METRIC CARD DESIGN:
  - Left border accent (4px, unique color per card)
  - Icon in colored circle (40x40)
  - Value: 24px bold
  - Label: 11px slate-400
  - Colors: Blue #3B82F6, Green #22C55E, Orange #F97316, Purple #A855F7
```

---

## AGENT-6: Motion & Interaction Designer

### Task 6.1 — Entrance Animations (CSS Specs)

```
All entrance animations use CSS @keyframes (NOT framer-motion initial/animate):

PAGE FADE-IN:
  @keyframes fadeIn { 0%: opacity 0 → 100%: opacity 1 }
  Duration: 0.4s ease-out
  Apply: animate-fade-in class

SLIDE UP (primary entrance):
  @keyframes slideUp {
    0%: opacity 0, translateY(30px), scale(0.95)
    100%: opacity 1, translateY(0), scale(1)
  }
  Duration: 0.5s ease-out
  Apply: animate-slide-up with staggered animation-delay

STAGGER PATTERN:
  Logo: 0.1s delay
  Title: 0.2s delay
  Tagline: 0.3s delay
  Button 1: 0.4s delay
  Button 2: 0.5s delay
  Footer: 0.8s delay
  All with animationFillMode: both

FLOAT LOOP (logo):
  @keyframes float {
    0%, 100%: translateY(0) rotate(0)
    50%: translateY(-20px) rotate(2deg)
  }
  Duration: 6s, ease-in-out, infinite
```

### Task 6.2 — Interactive Animations (Framer Motion — user-triggered only)

```
USE FRAMER MOTION ONLY FOR:

1. whileHover on buttons:
   { y: -2, boxShadow: '0 0 30px rgba(249,115,22,0.25)' }

2. whileTap on buttons:
   { scale: 0.97 }

3. AnimatePresence for:
   - Login card swap (home page)
   - Step transitions (form pages)
   - Scheme card expand/collapse (results)
   - Recent registration list items (dashboard live feed)

4. Counter pulse (dashboard):
   CSS transition: transform 0.3s on scale change

DO NOT USE framer-motion FOR:
   - Page entrance (use CSS @keyframes)
   - Element reveal on mount (use CSS animation-delay)
   - Any animation that must complete even when tab is hidden
```

### Task 6.3 — Loading States

```
SKELETON PULSE:
  @keyframes skeletonPulse {
    0%, 100%: opacity 0.06
    50%: opacity 0.12
  }
  Background: rgba(0,0,0,0.06)
  Duration: 1.5s, ease-in-out, infinite

BUTTON LOADING SPINNER:
  5x5 circle, 2px border
  Border color: rgba(255,255,255,0.3)
  Border-top color: white
  animation: spin 0.8s linear infinite

LIVE DOT (dashboard):
  @keyframes livePulse {
    0%, 100%: opacity 1, shadow 8px
    50%: opacity 0.6, shadow 16px
  }
  Color: #22C55E
```

---

## AGENT-7: Asset Export & Dev Handoff

### Task 7.1 — Design Token Export

```
Export from Figma to:

1. CSS CUSTOM PROPERTIES (tokens.css):
   --color-saffron-50 through --color-saffron-900
   --color-purple-50 through --color-purple-900
   --shadow-glass, --shadow-card-hover, --shadow-3d-button
   --radius-card: 20px
   --radius-button: 16px
   --radius-input: 12px

2. TAILWIND CONFIG EXTENSION (design-tokens.js):
   colors, boxShadow, borderRadius, animation, keyframes

3. SPACING SCALE:
   Touch target minimum: 44px (min-h-touch)
   Card padding: 20px
   Button padding: 14px 24px
   Input padding: 14px 16px
   Section gap: 16px
   Card gap: 16px
```

### Task 7.2 — SVG Asset Export

```
Export all icons and illustrations as:

1. INLINE SVG (for React components):
   - Logo variants (already in SaashaktiLogo.tsx)
   - Scheme category icons (as React components)
   - Empty state illustrations

2. STATIC SVG (for /public folder):
   - OG image background
   - Splash screen elements

3. PNG FALLBACKS (@2x):
   - Favicon set
   - PWA manifest icons
   - Social sharing OG image (1200x630)

NAMING CONVENTION:
  icon-{name}-{size}.svg
  illustration-{name}.svg
  logo-{variant}-{size}.{ext}
```

### Task 7.3 — Responsive Breakpoint Specs

```
BREAKPOINTS:
  xs: 320px (budget phone minimum)
  sm: 390px (standard phone)
  md: 768px (tablet)
  lg: 1024px (landscape tablet)
  xl: 1920px (dashboard projector)

PER-BREAKPOINT SPECS:
  xs-sm: Single column, full-width cards, 16px side padding
  md: 2-column form layout option
  lg: Side-by-side scheme cards
  xl: Dashboard grid layout (no scroll, 1920x1080 fixed)

FONT SCALE:
  xs: body 14px, heading 20px, counter 4rem
  sm: body 16px, heading 24px, counter 5rem
  xl: body 14px (dashboard), counter 8rem
```

---

## AGENT-QC: Quality Check Monitor & Integrator

### QC Checklist — Run After Each Agent Delivers

```
CHECKLIST PER DELIVERABLE:

□ BRAND CONSISTENCY
  □ Saffron #F97316 used correctly (not orange-600 or similar)
  □ Purple #7C3AED used correctly
  □ Gradient direction: 135deg consistently
  □ Logo matches approved SVG exactly
  □ Hindi font: Noto Sans Devanagari everywhere

□ GOVERNMENT STANDARD
  □ No frivolous decoration or inappropriate imagery
  □ Official department name in footer
  □ Hindi-first, English secondary
  □ Professional, dignified tone
  □ No external tracking/analytics scripts

□ ACCESSIBILITY
  □ Contrast ratio ≥ 4.5:1 for all text
  □ Touch targets ≥ 44px
  □ Form labels properly associated
  □ Color not the only indicator (icons + text)
  □ Screen reader support (aria-labels in Hindi)

□ 3D CONSISTENCY
  □ All cards use same glass-card base style
  □ All buttons use same 3D push-down mechanic
  □ Shadow depths are proportional and consistent
  □ Border-radius: cards 20px, buttons 16px, inputs 12px
  □ No competing animation styles

□ LIGHT THEME COMPLIANCE
  □ Background: light gradients (#F8FAFC family)
  □ Text: slate-900 primary, slate-600 labels, slate-400 secondary
  □ Cards: white at 75% opacity with subtle borders
  □ No remnant dark-theme colors (no white text on light bg)
  □ Shadows use rgba(0,0,0,X) not rgba(255,255,255,X)

□ ANIMATION SAFETY
  □ Entrance animations use CSS @keyframes (not framer-motion)
  □ animationFillMode: both on all staggered elements
  □ Framer-motion only for interactive (hover/tap/presence)
  □ No animation depends on requestAnimationFrame for visibility
  □ Animations complete even when browser tab is hidden

□ DASHBOARD (1920x1080)
  □ All content fits in single screen — NO scrolling
  □ Text readable at 3-meter projector distance
  □ Counter font ≥ 8rem
  □ LIVE indicator visible and pulsing
  □ Real-time updates don't break layout

□ SCHEME CARDS
  □ Every scheme shows: name (hi+en), benefit amount, frequency
  □ Expandable detail shows: eligibility, documents, process, links
  □ Met/unmet criteria clearly differentiated (✅/❌)
  □ Official portal links are correct and clickable
  □ Auto-fetch freshness date visible
  □ All 22+ schemes have complete data
```

### Integration Process

```
WORKFLOW:

1. AGENT-1 delivers logo → QC approves → distribute to all agents
2. AGENT-2 delivers components → QC approves → AGENT-4 uses in screens
3. AGENT-3 delivers icons/illustrations → QC approves → AGENT-4 places
4. AGENT-4 delivers screen mockups → QC reviews against checklist
5. AGENT-5 delivers dashboard → QC reviews at 1920x1080
6. AGENT-6 delivers animation specs → QC verifies no rAF dependencies
7. AGENT-7 exports assets → QC verifies naming, sizing, format
8. QC runs full checklist across all deliverables
9. QC produces FINAL SIGN-OFF document with:
   - Screenshots of all screens (mobile + dashboard)
   - Animation spec verification
   - Accessibility audit results
   - Brand consistency confirmation
   - List of any remaining issues with severity rating

BLOCKING GATES:
  - Logo must be QC-approved before ANY screen work begins
  - Component library must be QC-approved before screen mockups
  - All screen mockups must be QC-approved before dev handoff
  - Dashboard must be QC-approved at actual 1920x1080 resolution
```

### Final QC Report Template

```
# SAASHAKTI Design QC Report
Date: ____
QC Agent: AGENT-QC

## Logo & Brand: □ PASS / □ FAIL
Notes:

## Component Library: □ PASS / □ FAIL
Notes:

## Icons & Illustrations: □ PASS / □ FAIL
Notes:

## Screen Mockups (8 screens): □ PASS / □ FAIL
  Home: □  Registration (5 steps): □□□□□  Results: □  Dashboard: □
Notes:

## Animation Specs: □ PASS / □ FAIL
Notes:

## Accessibility: □ PASS / □ FAIL
  Contrast: □  Touch targets: □  Labels: □  Screen reader: □
Notes:

## Dashboard @ 1920x1080: □ PASS / □ FAIL
  Fits in one screen: □  Readable at distance: □  Live updates: □
Notes:

## Scheme Detail Completeness: □ PASS / □ FAIL
  All 22+ schemes: □  Eligibility details: □  Documents: □
  Application process: □  Official links: □  Auto-fetch status: □
Notes:

## FINAL VERDICT: □ APPROVED FOR LAUNCH / □ REVISIONS NEEDED
Priority issues:
1.
2.
3.
```

---

## TOOL-SPECIFIC INSTRUCTIONS

### Figma
- Create in a shared team project: "Saashakti Design System"
- Use Auto Layout for all components
- Name layers semantically (e.g., "btn-3d-primary/default")
- Set up color styles, text styles, effect styles as design tokens
- Enable Dev Mode for handoff

### Canva
- Use "Magic Design" for initial concepts, then refine manually
- Export at 2x resolution minimum
- Use brand kit feature to lock colors/fonts
- Generate multiple variants, let QC pick best

### Google Stitch
- Use for 3D element renders (buttons, cards, dashboard)
- Input exact hex colors in prompt
- Request multiple angles/states
- Export as high-res PNG with transparency

### Pomelli
- Use for realistic 3D glass/material renders
- Specify exact dimensions and materials
- Light source: top-left, warm white
- Export layered PSD if possible, PNG minimum

### Midjourney / DALL-E (fallback for illustrations)
- Use --style raw for clean, professional output
- Include "government app", "professional", "minimal" in prompts
- Upscale to 4x before export
- Remove any generated text (use only as visual reference)
