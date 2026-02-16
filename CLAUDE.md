# Handy — Global Tax Compliance Platform

## What This Is
Handy is a global tax compliance platform that helps individuals and businesses understand their tax obligations across jurisdictions. The first vertical is **crypto tax compliance** — helping users figure out what they owe, where, and how to file. The platform will expand to cover all cross-border tax obligations including income, capital gains, VAT/GST, and more.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Project Structure
```
app/                  → Next.js App Router pages and layouts
components/           → Shared React components
lib/rules-engine/     → Tax rules engine (jurisdiction rules, thresholds, calculations)
lib/data/             → Static data (country configs, tax brackets, deadlines)
```

## Design System
- **Primary (Navy):** #1a1a2e
- **Accent (Teal):** #00d4aa
- Dark theme by default, clean and professional

## Key Concepts
- **Rules Engine:** Evaluates a user's situation against jurisdiction-specific tax rules to determine obligations
- **Onboarding Wizard:** Collects user context (residency, income sources, asset types) to personalize compliance checks
- **Obligations:** The actionable output — what to file, where, by when
