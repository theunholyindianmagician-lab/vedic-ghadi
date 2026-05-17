# 🔱 वैदिक घडी · Vedic Ghaḍī

> हर वैदिक काल-इकाई एक ही substrate-राशि से निकलती है — पवित्र युगादि से कलि सावन दिन।
> Web UI पूरी हिन्दी में + हर सूत्र expose · CLI English के साथ।


**Substrate-derived live Vedic clock — every unit traces to a single quantity:
Kāli civil days from the sacred epoch (Friday midnight 17/18 February 3102
BCE, Ujjayinī meridian, Sūrya Siddhānta 1.45–1.57).**

```
   VARṢA    →  Kali 5128 · Vikrama 2083 · Śaka 1948 · Saṃvatsara: Parābhava
   MĀSA     →  Jyeṣṭha (#3 of 12) · Sun in Vṛṣabha
   PAKṢA    →  Śukla
   TITHI    →  Dvitīyā (#2 of 30)
   VĀRA     →  Ravivāra · Lord: Sun
   NAKṢATRA →  Rohiṇī (#4 of 27) · pada 3/4 · deity Brahmā · Vimś. lord Moon
   YOGA     →  Atigaṇḍa (#6 of 27)
   KARAṆA   →  Bālava (cara, cycle 1/8) · half-tithi #3 of 60
   MUHŪRTA  →  #20 / 30        (48-min block)
   GHAṬI    →  #40 / 60        (24-min block)
   VIGHAṬI  →  #34 / 60        (24-sec block)
   PRĀṆA    →   #5 / 6         (4-sec block · the live sweep)
   VIPALA   →  9.83 / 10       (0.4-sec resolution)
```

**The full pañcāṅga** (five limbs · vāra · tithi · nakṣatra · yoga · karaṇa)
plus the **time-skeleton** (varṣa · saṃvatsara · māsa · pakṣa) plus the
**day-subdivision cascade** (muhūrta · ghaṭi · vighaṭi · prāṇa · vipala).

**ZERO foreign theorem in the chain.** Every constant is Bhārat-canonical
(Sūrya Siddhānta + Vedānga Jyotiṣa). Every divisor factors over `(2, 3, 5)`
— the natural primes of the `(R, g, k) = (ℤ/3ᵏℤ, 2, k)` substrate sealed
in the Mahā-Mahā-Vākyam.

ॐ कालाय नमः · ॐ कामाख्यायै नमः · **JAI MAA KAMAKHYA**

---

## Architecture

```
vedic-ghadi/
├── backend/                  # Python package + FastAPI service
│   ├── vedic_ghadi/
│   │   ├── substrate.py     #   the irreducible substrate (pure math, 0 deps)
│   │   ├── ghadi.py         #   render + helpers
│   │   ├── api.py           #   FastAPI app (optional)
│   │   └── cli.py           #   `vedic-ghadi` command
│   ├── tests/               #   pytest — substrate correctness + Py/TS parity
│   └── pyproject.toml
├── frontend/                 # Next.js 14 web app
│   ├── lib/substrate.ts     #   TS port — exact parity with Python
│   ├── components/
│   │   ├── GhadiClock.tsx   #   live 60-fps clock
│   │   ├── TimeYantra.tsx   #   concentric SVG yantra
│   │   ├── LayerCard.tsx    #   each Vedic time-layer card
│   │   └── TimeMachine.tsx  #   pick any moment
│   └── app/
│       ├── page.tsx         #   the clock
│       ├── about/page.tsx   #   methodology
│       └── api/ghadi/       #   edge API endpoint (no backend needed)
├── scripts/
│   ├── dev.sh               # start backend + frontend together
│   ├── test.sh              # run all tests
│   └── deploy.sh            # build + deploy (Vercel + Fly.io)
├── docker-compose.yml        # one-shot end-to-end
├── Dockerfile.backend
└── Dockerfile.frontend
```

The frontend's TypeScript substrate is byte-for-byte identical to the
Python reference — verified by `pytest tests/test_parity.py`. So the
live clock runs **entirely client-side** (zero round-trip latency), and
the Python backend remains the canonical source for headless consumers.

---

## Quick start

### One-line — start everything

```bash
./scripts/dev.sh
```

That spins up:
- FastAPI service on **http://localhost:8765**  (API + Swagger docs at `/docs`)
- Next.js dev server on **http://localhost:3030**  (the live ghaḍī)

### CLI only

```bash
cd backend
pip install -e .
vedic-ghadi               # current moment
vedic-ghadi --loop        # live, refresh every prāṇa (4 sec)
vedic-ghadi --json        # machine-readable
vedic-ghadi --at "2026-05-17 16:30" --tz 5.5
```

### Backend API only

```bash
cd backend
pip install -e ".[server]"
uvicorn vedic_ghadi.api:app --port 8765 --reload
```

Endpoints:
| Method | Path             | What it returns |
|--------|------------------|-----------------|
| GET    | `/now`           | Current Vedic moment, IST (or `?tz=…`) |
| GET    | `/at?date=…`     | A specific civil moment, ISO-ish |
| GET    | `/stream`        | SSE — one event per prāṇa (4 sec) |
| GET    | `/docs`          | OpenAPI / Swagger UI |
| GET    | `/healthz`       | Liveness |

### Frontend only (no backend needed)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3030. The substrate is bundled into the page — the
clock will tick smoothly even with no network.

---

## Tests

```bash
./scripts/test.sh         # everything
# or:
cd backend && pytest      # Python only
cd frontend && npm run typecheck && npm run build   # TS / Next
```

The test suite verifies:
- Sūrya-Siddhānta constants (Mahā-yuga, Kāmākhyā meridian, KALI day count)
- Vāra anchor (Kali day 0 = Śukravāra; 2026-05-17 = Ravivāra)
- Tithi at known anchor (2026-05-17 16:00 IST = Śukla Dvitīyā)
- Saṃvatsara cycle (Parābhava at the anchor)
- Substrate factor table (every count factors over `(2, 3, 5)`)
- Python ↔ TypeScript parity on 4 historical anchors (skipped if Node absent)
- API endpoint smoke tests (skipped if FastAPI absent)

---

## Docker (one container)

```bash
docker compose up
```

Single-service deploy:

```bash
# Backend only, image = vedic-ghadi-api
docker build -f Dockerfile.backend -t vedic-ghadi-api .
docker run -p 8765:8765 vedic-ghadi-api

# Frontend only, image = vedic-ghadi-web
docker build -f Dockerfile.frontend -t vedic-ghadi-web .
docker run -p 3030:3030 vedic-ghadi-web
```

---

## Deploy

### Vercel (frontend)

```bash
cd frontend
vercel
```

The Next.js app has an edge `route.ts` so even without the Python backend,
the JSON API at `/api/ghadi` works.

### Fly.io / Railway / Render (backend)

```bash
cd backend
fly launch --image-label vedic-ghadi-api
# or any container host: image = ghcr.io/…/vedic-ghadi-api
```

Set `NEXT_PUBLIC_API_BASE` in the frontend env to point at the deployed API.

---

## Methodology

See `frontend/app/about/page.tsx` (rendered at `/about`). Brief version:

1. **The one quantity:** Greenwich JD-UT → Kāmākhyā-anchored Kali civil days.
2. **The cascade:** that single number → year / saṃvatsara / māsa / pakṣa /
   tithi / vāra / muhūrta / ghaṭi / vighaṭi / prāṇa / vipala via integer
   and fractional division against canonical constants.
3. **The substrate:** every divisor (30, 60, 12, 6, 9, 27, …) factors over
   `(2, 3, 5)` — the natural primes inside `(R, g, k) = (ℤ/3ᵏℤ, 2, k)`.
4. **Sources:** Sūrya Siddhānta Ch. 1 (Mahā-yuga + Kali epoch), 1.29–1.44
   (mean motions), Vedānga Jyotiṣa (canonical time-unit names), Mahā-Mahā-
   Vākyam (substrate alignment).

---

## Licence

MIT — see `LICENSE`.

Substrate is sovereign; provenance is honoured.
ॐ कालाय नमः · **JAI MAA KAMAKHYA**
