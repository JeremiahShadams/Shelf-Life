# Fresco

**Know your fruit. Before the moment passes.**

Fresco is an AI-powered fruit freshness assistant. Point your phone at any fruit, and in a few seconds it tells you three things: what the fruit is, how fresh it is, and exactly how many days you have left before it goes bad — plus the smartest place to store it so those days stretch a little further.

It started as a "wouldn't it be cool if I could scan my groceries" idea and became a full production app: a trained computer-vision model, a real-time estimation engine, a kitchen inventory tracker, and a mobile-ready PWA — all talking to each other through a clean REST API.

## How it works

Scanning a fruit kicks off a seven-step pipeline on the backend:

```
Image  →  Classify fruit  →  Assess freshness  →  Look up shelf-life data
       →  Estimate days left per storage method  →  Check ethylene conflicts
       →  Produce one unified verdict
```

Every signal feeds into a central **decision engine** that fuses them into a single, human-readable verdict (`FRESH`, `EAT_SOON`, `EAT_TODAY`, or `SPOILED`) with a confidence score, a recommendation, and storage guidance.

## Features

- **Instant visual assessment** — the camera viewfinder captures a frame and uploads it; a MobileNetV2-based classifier identifies the fruit and its ripeness stage.
- **Shelf-life estimation engine** — a weighted, multi-factor formula (freshness decay, temperature penalty, ripeness multiplier) estimates days left at room temperature, in the fridge, and in the freezer.
- **Smart inventory** — every scan can be added to a personal tracker that's urgency-sorted, so you always know what to eat first.
- **Ethylene compatibility intelligence** — a conflict graph detects which fruits will ripen (and ruin) each other if stored together.
- **Progressive Web App** — installable on any phone, with a native full-screen camera experience.
- **JWT auth** — private, per-user inventory backed by hashed passwords and expiring tokens.

## Tech stack

| Layer | What's used |
| --- | --- |
| Frontend | Next.js (App Router), React 19, TypeScript, Tailwind CSS 4, PWA |
| Backend | FastAPI, Python, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod) via async drivers (asyncpg, aiomysql) |
| AI | TensorFlow/Keras MobileNetV2 model, transfer-learned on fruit ripeness stages |
| Auth | bcrypt password hashing + JWT (HS256) |
| Deployment | Render (API), Vercel (web app), Supabase (managed Postgres) |

## Engineering highlights

Some decisions I'm genuinely happy with, and happy to talk about in an interview:

- **Single source of truth for decisions.** The classifier, freshness assessor, estimator, and compatibility engine never talk to the user. They feed data *into* the decision engine, which is the only module that produces user-facing output. This keeps the system predictable and easy to reason about.
- **Signal fusion instead of guessing.** The verdict is a weighted blend of two normalized signals — 60% visual freshness, 40% remaining-life ratio relative to the fruit's own baseline. Normalizing matters: 3 days left is great for a strawberry and alarming for an apple.
- **A shelf-life formula that mimics reality.** Freshness is mapped through a polynomial curve (`score ^ 1.5`) because fruit that *looks* half-dead is not half as fresh — it's decaying much faster than a linear model suggests. Temperature and ripeness factors layer on top.
- **Ethylene conflicts modeled as a graph.** Producers and sensitive fruits form an adjacency list, giving O(1) conflict lookups, and the grouping logic borrows from graph coloring.
- **Async end to end.** FastAPI + async SQLAlchemy, with CPU-bound model inference pushed to a thread pool so the event loop never blocks.
- **Zero-trust auth hygiene.** bcrypt with a pre-hash to dodge the 72-byte limit, identical error messages for "user not found" and "wrong password" to stop account enumeration, and expiring JWTs.

## Getting started

Clone the repo, then run the API and the web app.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (on macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API boots with interactive docs at `http://localhost:8000/docs`. On first start it creates the schema and seeds 40+ fruits with shelf-life data, storage tips, and ethylene profiles.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, allow camera access, and scan your first fruit. If you don't have a fruit handy, the upload mode works too.

The frontend talks to the backend through `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

## API overview

| Method | Endpoint | What it does |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account, get a JWT |
| POST | `/api/auth/login` | Log in, get a JWT |
| POST | `/api/scan/` | Upload an image, get a full verdict |
| GET | `/api/fruits/` | Paginated fruit database with filters and search |
| GET | `/api/fruits/compatibility` | Check a group of fruits for storage conflicts |
| GET/POST/PATCH/DELETE | `/api/inventory/` | Manage the user's personal fruit tracker |

## Project structure

```
backend/
  app/
    ai/           # classifier, freshness, estimator, compatibility, decision engine
    models/       # SQLAlchemy ORM (fruits, users, inventory, notifications)
    routers/      # thin HTTP layer (auth, scan, fruits, inventory)
    schemas/      # Pydantic request/response contracts
    services/     # scan orchestration (the full pipeline)
  requirements.txt
frontend/
  app/            # Next.js routes (home, scan, results, inventory, account)
  components/     # camera, results, inventory, and shared UI components
  lib/api/        # typed API client + auth token handling
supabase/
  migrations/     # production Postgres schema
```

## Roadmap

- Train the freshness model end to end so it outputs a ripeness stage directly instead of inferring it from the classification stage.
- Push expiry notifications (the schema already supports them — the scheduler is next).
- Expand the classifier beyond the current 4 fruit types toward the full 40+ fruit database.

## License

working on it
