# Secure Digital Asset Exchange Platform — Figma UI/UX Specification

> **Platform Principle:** _"Verify before you trust."_  
> **Visual Style:** Modern Fintech & Security SaaS, Deep Navy (`#0B1120`), Verified Emerald (`#059669` / `#10B981`), Warning Amber (`#D97706`), Danger Rose (`#E11D48`), Neutral Surfaces (`#F8FAFC` / `#1E293B`).  
> **Target Implementation:** React 19 + Vite + Tailwind CSS v4 + React Router + Lucide Icons.

---

## 1. Design System Tokens & Foundations

### 1.1 Color Tokens

```
========================================================================================
TOKEN NAME                  HEX VALUE    RGBA / USAGE                      WCAG APCA
========================================================================================
--color-brand-primary       #0F172A      Deep Trust Navy                   PASS (AAA)
--color-brand-accent        #1E40AF      Fintech Royal Blue                PASS (AAA)
--color-brand-accent-hover  #1D4ED8      Active / Hover Blue               PASS (AAA)
--color-brand-subtle        #EFF6FF      Soft Blue Tint Surface            PASS (AAA)

--color-verified-success    #059669      Verified Badges, Checks           PASS (AA+)
--color-verified-subtle     #ECFDF5      Verified Pill Background          PASS (AAA)
--color-verified-border     #A7F3D0      Verified Stroke                   PASS (AAA)

--color-warning-amber       #D97706      Needs Review, Expiration Warning  PASS (AA)
--color-warning-subtle      #FFFBEB      Warning Pill Background           PASS (AAA)
--color-warning-border      #FDE68A      Warning Stroke                    PASS (AAA)

--color-danger-rose         #E11D48      Verification Failed, Dispute      PASS (AA+)
--color-danger-subtle       #FFF1F2      Failed Pill Background            PASS (AAA)
--color-danger-border       #FECDD3      Failed Stroke                     PASS (AAA)

--color-surface-bg          #0B1120      Deep Canvas Dark                  PASS (AAA)
--color-surface-card        #131D31      Elevated Container                PASS (AAA)
--color-surface-card-hover  #192640      Interactive Hover Container       PASS (AAA)
--color-surface-border      #233354      Card & Divider Hairline (1px)     PASS (AAA)

--color-text-primary        #F8FAFC      Primary Typography Heading        PASS (AAA)
--color-text-secondary      #94A3B8      Subtitle & Label Typography       PASS (AAA)
--color-text-muted          #64748B      Footers, Timestamps, Disclaimers  PASS (AA)
--color-text-disabled       #475569      Disabled Button / Input Text      PASS
========================================================================================
```

### 1.2 Typography Hierarchy (Inter / IBM Plex Sans)

| Level               | Size / Line-height | Weight         | Letter Spacing | CSS Equivalent                                       |
| :------------------ | :----------------- | :------------- | :------------- | :--------------------------------------------------- |
| **Display**         | 48px / 56px        | 800 (Bold)     | -0.025em       | `text-4xl md:text-5xl font-extrabold tracking-tight` |
| **H1**              | 36px / 44px        | 700 (Bold)     | -0.02em        | `text-3xl md:text-4xl font-bold tracking-tight`      |
| **H2**              | 28px / 36px        | 700 (Bold)     | -0.015em       | `text-2xl md:text-3xl font-bold tracking-tight`      |
| **H3**              | 20px / 28px        | 600 (Semibold) | -0.01em        | `text-xl font-semibold`                              |
| **H4**              | 16px / 24px        | 600 (Semibold) | 0.0em          | `text-base font-semibold`                            |
| **Body Large**      | 18px / 28px        | 400 (Regular)  | 0.0em          | `text-lg font-normal leading-relaxed`                |
| **Body Default**    | 14px / 20px        | 400 (Regular)  | 0.0em          | `text-sm font-normal leading-normal`                 |
| **Body Small**      | 12px / 16px        | 400 (Regular)  | 0.01em         | `text-xs font-normal`                                |
| **Caption / Badge** | 11px / 14px        | 600 (Semibold) | 0.04em         | `text-[11px] font-semibold uppercase tracking-wider` |
| **Button Text**     | 14px / 20px        | 600 (Semibold) | 0.01em         | `text-sm font-semibold tracking-wide`                |

### 1.3 Spacing & Radius Scale

- **Spacing Grid:** 4px base (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`)
- **Corner Radii:**
  - `Small (rounded-md)`: 6px (Input fields, dropdown items, tags)
  - `Medium (rounded-xl)`: 12px (Cards, alerts, modals)
  - `Large (rounded-2xl)`: 16px (Primary dashboard containers, hero cards)
  - `Pill (rounded-full)`: 9999px (Verification pills, step counters, badges)
- **Elevation / Shadows:**
  - `Level 1 (shadow-sm)`: `0 1px 2px rgba(0, 0, 0, 0.2)`
  - `Level 2 (shadow-md)`: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)`
  - `Level 3 (shadow-xl)`: `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)`
  - `Glow Subtle`: `0 0 24px -4px rgba(30, 64, 175, 0.25)`

---

## 2. Figma File Organization (18 Dedicated Pages)

```
📦 Secure_Ticket_Exchange_Figma_Library.fig
 ┣ 📄 01 — Cover (Project Identity, Principle, Version 1.0, Changelog)
 ┣ 📄 02 — Design System (Tokens, Color Swatches, Type Scale, Spacing, Shadows, Radii)
 ┣ 📄 03 — Components (Buttons, Inputs, Badges, Modals, Steppers, Skeletons, Ticket Cards)
 ┣ 📄 04 — Landing Page (Hero, 5-Stage Verification Pipeline, Marketplace Preview, FAQ, CTA)
 ┣ 📄 05 — Authentication (Login, Register, Email Verification, Password Reset)
 ┣ 📄 06 — User Dashboard (Greeting, Verification Widget, Metrics, Recent Listings & Tx)
 ┣ 📄 07 — KYC Verification (5-Step Identity Flow: Personal, Doc Type, Upload/Capture, Audit)
 ┣ 📄 08 — Marketplace (Search, Multi-Filter, Asset Types, Live Cards, Countdown Timers)
 ┣ 📄 09 — Asset Details (Metadata, 6-Stage Timeline, Seller Trust, Single-Buyer Reserve)
 ┣ 📄 10 — Upload & Verification (Drag & Drop, 7-Stage OCR Timeline, Full Inspection Report)
 ┣ 📄 11 — Create Listing (5-Step Wizard: Select, Badges, Anti-Scalping Price Cap, Publish)
 ┣ 📄 12 — Transactions & Escrow (6-Stage Timeline: Created -> Reserved -> Paid -> Transferred)
 ┣ 📄 13 — Secure Messaging (Split-View Chat, #TX-10293 Context Header, Attachments)
 ┣ 📄 14 — Notifications (Filtered Tabs: Verification, Tx, Security, System with Unread)
 ┣ 📄 15 — Profile & Settings (Overview, Verified Badge, Active Sessions, 2FA Placeholder)
 ┣ 📄 16 — Enterprise Admin (Dashboard Metrics, KYC Inspector, Risk Center, Audit Logs)
 ┣ 📄 17 — Responsive Screens (Desktop 1440px, Tablet 768px, Mobile 375px)
 ┗ 📄 18 — Prototype Flows (Interactive Clickable Connections for 6 Primary Journeys)
```

---

## 3. Interactive Prototype Wireframe Pathways

### Flow 1: Guest Landing to Verified Dashboard

`04 Landing` -> `Click "Explore Marketplace" or "Sign Up"` -> `05 Register (with Password Strength Meter)` -> `05 Email Verification` -> `06 User Dashboard`

### Flow 2: Multi-Step KYC Identity Verification

`06 Dashboard ("Complete KYC" Banner)` -> `07 KYC Step 1: Personal Info` -> `07 Step 2: NID/Passport Selection` -> `07 Step 3: Document Upload` -> `07 Step 4: Verification Engine Analysis` -> `07 Step 5: Verification Success (Identity ✓ Verified)`

### Flow 3: Ticket Upload & Multi-layer Verification Inspection

`06 Dashboard ("Upload Asset")` -> `10 Drag-and-drop PDF/JPG` -> `10 Live 7-stage processing animation` -> `10 Verification Result Report (Readability, OCR, Duplicate, External Check, Risk Score)` -> `10 Technical Details Drawer` -> `11 Create Listing Button`

### Flow 4: Anti-Scalping Guided Listing Wizard

`11 Step 1: Select Verified Ticket` -> `11 Step 2: Review Security Badges` -> `11 Step 3: Price Setting (Anti-Scalping 0% Cap Warning for Railway)` -> `11 Step 4: Terms & Seller Responsibilities` -> `11 Step 5: Published to Marketplace`

### Flow 5: Marketplace Discovery to Atomic Reservation & Escrow Transfer

`08 Marketplace Search & Filter` -> `09 Asset Details Page (Inspect 6-Stage Timeline)` -> `09 Click "Reserve Ticket"` -> `12 Reservation Active (10:00 Countdown Lock)` -> `12 Escrow Payment Pending` -> `12 Payment Confirmed` -> `12 Transfer Execution via Authorized Provider` -> `12 Completed (New Barcode & Passenger Name Updated)`

### Flow 6: Enterprise Admin Moderation & Risk Investigation

`16 Admin Dashboard` -> `16 Fraud / Risk Center (Flagged Assets with HIGH Risk)` -> `16 Deep Signal Inspection` -> `16 Action: Suspend Listing / Escalate Manual Review` -> `16 Immutable Audit Log Entry Confirmation`

---

## 4. Frontend Component Token Mapping

| Figma Component     | State Variants                           | React / Tailwind Mapping                                                                                       |
| :------------------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `Button/Primary`    | Default, Hover, Focus, Disabled, Loading | `bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 transition`                     |
| `Button/Secondary`  | Default, Hover, Focus, Disabled          | `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-5 py-2.5`                |
| `Badge/Verified`    | Small, Medium, Large                     | `bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 font-semibold text-xs` |
| `Badge/NeedsReview` | Small, Medium                            | `bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full px-3 py-1 font-semibold text-xs`       |
| `Badge/Failed`      | Small, Medium                            | `bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full px-3 py-1 font-semibold text-xs`          |
| `Card/Ticket`       | Default, Hover, Reserved, Sold           | `bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition shadow-md`          |
| `Stepper`           | Inactive, Active, Completed              | `flex items-center gap-3 text-sm font-medium border-b border-slate-800 pb-4`                                   |
| `Modal/Dialog`      | Open, Close, Backdrop Blur               | `fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4`                         |
