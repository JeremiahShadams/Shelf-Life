# Fresco Mobile App

Native iOS + Android client for the Fresco shelf-life API. Built with Expo SDK 57, Expo Router (`src/app`), TypeScript.

> Design standard: global tier — calm, precise, restrained. One primary action per screen.
> Rule — nothing ships that looks generic.

## Setup

```powershell
cd fresco-app
npm install          # node_modules was moved into place; run once to reconcile
npx expo start       # or: npm run android / ios / web
```

## Structure

```
fresco-app/
├── src/
│   ├── app/                   # Expo Router (file-based routing)
│   │   ├── (auth)/            # login.tsx, register.tsx
│   │   ├── (tabs)/            # index.tsx (Scan), fridge, ideas, profile
│   │   └── scan-result.tsx
│   ├── components/
│   │   ├── ui/                # Button, Text, Card, Input, Badge, EmptyState, ErrorState, LoadingState
│   │   ├── scan/              # CameraView, ScanResultCard
│   │   └── fridge/            # FridgeItemCard, DaysLeftBadge
│   ├── services/              # api.ts (FastAPI client), auth.ts, notifications.ts
│   ├── stores/                # Zustand: fridge, session
│   └── types/
├── theme/                     # LOCKED design system (root-level — imported by src/)
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts               # useTheme() — the only import components use
├── app.json
└── package.json
```

## Design System (LOCKED — do not edit ad hoc)

All tokens live in `theme/`. Excerpts of the rules they encode:

| File | Rule |
|---|---|
| `colors.ts` | light + dark palettes. Accent green `#2F9E44` is a **signal** (freshness/success), never decoration. Primary flips near-white in dark mode |
| `typography.ts` | SF Pro/Inter. Roles only: largeTitle 30, title 21, headline 17, body 16, caption 14, micro 13. No ad-hoc sizes |
| `spacing.ts` | 8pt system (4/8/16/24/32/40). Screen gutter always 20. Radii: card 16, button 14, input 12. Shadows iOS-only, floating elements only |
| `index.ts` | `useTheme()` consumes `useColorScheme()` — dark mode follows the system from day one |

**Days-left color rule** (the only legal semantic color mapping anywhere in the app):

- days > 4 → `textSecondary`
- days 2–4 → `warning`
- days 0–1 → `danger`

**Component rules:**

1. One primary action per screen — exactly one `Button` with `variant="primary"`.
2. Every screen implements all four states: loading, empty, error, content. No exceptions.
3. Icons: Lucide/Phosphor style only. No illustrations.
4. Bottom nav: strictly 4 items — Scan, Fridge, Ideas, Profile.
5. Light + Dark are equal first-class citizens; never hardcode a hex inside a component.

## Build order

1. Theme ✅ (`theme/` — locked)
2. Core `ui/` components (Button, Text, Card, Input, states)
3. Scan screen (offline layout → loading → error → connect API)
4. Fridge screen
5. Ideas screen
6. Profile + auth
7. Push notifications

## Backend

The mobile app talks to the existing FastAPI backend (`../backend`)
(`NEXT_PUBLIC_API_URL` equivalent: set `EXPO_PUBLIC_API_URL`). Backend health
work (model artifact, truthful days-left, notification scheduler) must land
before the scan and fridge slices wire up to the API.
