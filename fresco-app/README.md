# Fresco Mobile App

Native iOS + Android client for the Fresco shelf-life API. Built with Expo SDK 58, Expo Router (`src/app`), TypeScript, and TanStack Query.

> Design standard: Uber Base — black and white surfaces, bold tight type, Uber Blue (`#276EF1`) accents. One primary action per screen.

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
│   │   ├── add-item.tsx       # manual add: fruit search → storage + quantity
│   │   ├── inventory/[id].tsx # item detail: storage switch, eaten, remove
│   │   ├── notifications.tsx  # expiry alerts
│   │   └── scan-result.tsx    # modal verdict from /api/scan
│   ├── components/
│   │   ├── ui/                # Button, Text, Card, Input, Badge, FAB, states
│   │   └── fridge/            # add sheet, success view
│   ├── hooks/                 # inventory, fruits, notifications, health
│   ├── services/              # api, auth, inventory, fruits, scan, system
│   ├── stores/                # Zustand: auth session, fridge UI filter
│   ├── types/                 # hand-written mirrors of the API schemas
│   └── utils/                 # UTC-safe date parsing
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
| `colors.ts` | Light + dark palettes. Black/white primary, Uber Blue `#276EF1` accent, status Urgent/Warning/Success. Includes a `shadow` token — never hardcode a hex in a component |
| `typography.ts` | Roles only: largeTitle 30, headline 24, title 20, cardTitle 17, body 15, caption 14, micro 12, label 10, statusLarge 32. No ad-hoc sizes |
| `spacing.ts` | 4/8 grid. Screen gutter 20, card/button radius 12, sheet radius 24, controls 56 tall, FAB 56 |
| `index.ts` | `useTheme()` consumes `useColorScheme()` — dark mode follows the system from day one |

**Days-left color rule** (the only legal semantic color mapping anywhere in the app):

- days > 4 → `statusSuccess` (calm)
- days 2–4 → `statusWarning`
- days 0–1 → `statusUrgent` / "DAY LEFT"
- days ≤ 0 → `statusUrgent` / "EXPIRED"

Always render the live `days_left` from the API — never `estimated_days_remaining`, which is only the at-scan snapshot.

**Component rules:**

1. One primary action per screen — exactly one `Button` with `variant="primary"`.
2. Every screen implements all four states: loading, empty, error, content. No exceptions.
3. Icons: Ionicons only (bundled with `@expo/vector-icons`). No illustrations.
4. Bottom nav: strictly 4 items — Scan, Fridge, Ideas, Profile.
5. Light + dark are equal first-class citizens; never hardcode a hex inside a component.

## Build order

1. Theme ✅ (`theme/` — locked)
2. Core `ui/` components ✅ (Button, Text, Card, Input, Badge, FAB, empty/error/loading states)
3. Auth ✅ (sign in, register, guest mode, boot validation, route guard)
4. Scan ✅ (camera + library fallback; 503 explains the missing model and links to manual add)
5. Fridge ✅ (live list, summary counts, filters, pull-to-refresh, item detail, storage switch, eaten/remove)
6. Manual add ✅ (fruit search, storage, quantity, storage tips)
7. Ideas ✅ (eat-first list, ethylene compatibility check)
8. Profile ✅ (alert count, AI scanning status, sign out)
9. Notifications ✅ (scheduled/delivered expiry alerts)
10. Push notifications ⏳ (needs a development build and the backend scheduler)
11. Model deployment ⏳ (`backend/models/fresco_model.keras` from `Freshness44.ipynb`)

## Backend

The mobile app talks to the existing FastAPI backend (`../backend`). Point it at a server with `EXPO_PUBLIC_API_URL`; otherwise the app derives the host from Expo's dev-server LAN address and uses port 8000.

Scanning stays unavailable (HTTP 503) until the Keras model is exported, but the rest of the loop — auth, manual add, inventory, alerts, ideas — works without it. In Guest mode the inventory is kept locally, so the demo needs no account or server writes.
