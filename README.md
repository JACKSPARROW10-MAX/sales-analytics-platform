# Sales Analytics Platform

An end-to-end sales business-intelligence platform: CSV/ERP ingestion → validation →
PostgreSQL star schema → analytics, forecasting, anomaly detection and GenAI
recommendations → FastAPI → a React dashboard, plus scheduled PDF + email reporting.

It runs against **local Docker PostgreSQL** for development and **Supabase / any cloud
PostgreSQL** in production — the only thing that changes is `DATABASE_URL`.

---

## 1. Problem statement

Sales teams sit on transactional data (POS exports, ERP dumps, spreadsheets) but lack a
single place that turns it into decisions. Raw exports are inconsistent, there is no
trusted "one number", spikes and billing errors go unnoticed, and forecasting / strategy
work happens ad-hoc in spreadsheets. Building the warehouse, the models and the dashboard
separately is slow and brittle.

## 2. Solution

One repository that takes messy sales files and produces:

- a validated, deduplicated **star-schema warehouse** in PostgreSQL;
- **live analytics** (revenue, orders, quantity, AOV, growth; by product, customer,
  category, region, price band) computed straight from SQL — no cached numbers;
- a **30-day revenue forecast** (Ridge regression on daily aggregates);
- **anomaly detection** (Isolation Forest + Z-score) with root-cause labels;
- **AI recommendations** grouped by theme (Groq LLM, deterministic fallback);
- an **executive PDF** generated from the current database on demand;
- a **weekly email** of that PDF via GitHub Actions.

## 3. Architecture

```
 CSV / ERP / feature files
          │  ingestion/ (extract + validate)
          ▼
   staging_* tables  ──►  etl/transform.py  ──►  star schema
                                                 dim_date, dim_product,
                                                 dim_customer, fact_sales
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
   api/ (FastAPI)                                        ml/ (scikit-learn)
   - /kpis, /analytics/*, /variance                      - forecasting (Ridge)
   - /forecast, /anomalies, /recommendations             - anomaly detection
   - /reports/summary, /reports/download                 - feature attribution
   - /ingest/upload, /pipeline/run, /health              - recommendations (Groq)
          │                                                       │
          ▼                                              data/ml_results.json (cache)
   dashboard/ (React + Vite + Tailwind + Recharts)
          │
   reports/ (reportlab PDF)  ──►  .github/workflows/weekly-report.yml  ──►  email
```

## 4. Features

| Area | What it does |
|---|---|
| Ingestion | CSV upload + ERP/feature file extract, encoding-tolerant parsing, CSV-injection sanitisation, 20 MB cap |
| Validation | Row-level checks (types, non-negative quantity/amount, date parsing); rejected rows quarantined to `data/rejected/` |
| Warehouse | Idempotent star schema; `fact_sales` keyed by source `transaction_id` so re-loads never double-count |
| Analytics | KPIs + time series + product / customer / category / subcategory / region / segment / pricing breakdowns, all live SQL |
| Forecasting | Daily revenue → Ridge regression → 30-day forecast with 90/95% bands and a MAPE-derived accuracy |
| Anomaly detection | Isolation Forest (Z-score fallback) on revenue/quantity/discount; severity + root-cause classification |
| Variance | Actual vs. 7-day moving-average baseline per product |
| Explainability | Statistical feature-attribution from the ML pipeline + per-anomaly root cause |
| GenAI | Groq LLM recommendations from real aggregates; deterministic rules engine when no key |
| Dashboard | 16 views, light/dark, responsive, loading/error/empty states everywhere |
| Reports | Executive PDF from live queries; `/reports/summary` for period + KPIs + status |
| Automation | Weekly cron + manual `workflow_dispatch`; fresh PDF emailed |
| Health | `/health` (API + DB), data-quality score, pipeline row counts |

## 5. Technology stack & why

| Layer | Choice | Why |
|---|---|---|
| Language | Python 3.12 | One language across ETL, ML, API; mature data ecosystem |
| Database | PostgreSQL (Docker or Supabase) | Star-schema SQL, window functions, `ON CONFLICT` upserts, ubiquitous hosting |
| DB access | SQLAlchemy 2 + psycopg2 | One pooled engine per process; TLS auto-enforced for cloud hosts |
| API | FastAPI + Uvicorn/Gunicorn | Async, typed, automatic OpenAPI docs, first-class file uploads |
| Rate limiting | slowapi | Simple global request cap |
| Data | pandas / NumPy | Standard for the transform + feature work |
| ML | scikit-learn | Ridge regression + Isolation Forest cover the forecast/anomaly needs without heavyweight deps |
| GenAI | Groq API (Llama 3.x) | Fast, cheap chat completions; strict JSON prompt; graceful fallback |
| PDF | reportlab | Precise, dependency-light PDF layout |
| Frontend | React 19 + Vite 8 | Fast dev/build, modern component model |
| Styling | Tailwind CSS 4 | Consistent design tokens, small CSS |
| Charts | Recharts 3 | Declarative, responsive, themeable |
| HTTP | axios | Interceptors, timeouts, form-data uploads |
| CI/CD | GitHub Actions | Lint/type/security/tests + Docker build; scheduled reporting |
| Container | Docker + Compose | Reproducible Postgres + app for local and deploy |

## 6. Database (PostgreSQL / Supabase)

Schema: [`db/schema.sql`](db/schema.sql) — applied by [`init_db.py`](init_db.py), idempotent
(`CREATE TABLE IF NOT EXISTS`), never drops data.

- **Staging** (raw, all text): `staging_sales`, `staging_products`, `staging_customers`, `staging_erp`
- **Star schema**: `dim_date`, `dim_product`, `dim_customer`, **`fact_sales`**
  (`sale_id` PK, FKs to the three dims, `quantity`, `revenue`, `discount`, `source_system`)

`fact_sales.sale_id` is derived from the source `transaction_id` (hash fallback when
missing) and inserted with `ON CONFLICT (sale_id) DO NOTHING`, so re-running the ETL or
re-uploading a file only adds genuinely new transactions.

**Cloud:** set `DATABASE_URL` to a Supabase / Neon / RDS URI. TLS (`sslmode=require`) is
applied automatically for non-local hosts. For Supabase use the **session pooler**
(`...pooler.supabase.com:5432`); it caps total client connections, so the app keeps one
small pooled engine (`DB_POOL_SIZE` / `DB_MAX_OVERFLOW`, default 3 + 2). For higher
concurrency use the transaction pooler (`:6543`) and raise those.

## 7. Docker

```bash
docker compose up -d postgres pgadmin      # local Postgres (:5432) + pgAdmin (:5050)
# ... run init_db.py + run_pipeline.py locally, or:
docker compose --profile prod up -d --build # postgres + the API (runs init_db then gunicorn)
```

No secrets in `docker-compose.yml` / `Dockerfile` — everything is `${VAR:-default}` or
read from `.env` at runtime. The image runs as a non-root user, 2 gunicorn workers.

## 8. FastAPI backend

- `GET /health` → `{"status","database",...}` — no credentials, ever.
- `GET /api/v1/kpis` — revenue, orders, quantity, AOV, growth + forecast/anomaly/rec summary.
- `GET /api/v1/analytics/{sales,products,customers,categories,regions,pricing}` — live SQL.
- `GET /api/v1/{forecast,anomalies,recommendations,variance,explainability}`.
- `GET /api/v1/{data_quality,pipeline_health}`.
- `GET /api/v1/reports/summary` · `GET /api/v1/reports/download` (fresh PDF).
- `POST /api/v1/ingest/upload` (CSV) · `POST /api/v1/pipeline/run`.

Config is env-based (`ENVIRONMENT`, `HOST`, `PORT`, `CORS_ORIGINS`, `LOG_LEVEL`…),
errors return safe generic messages (full detail only in server logs), CORS origins are
configurable, security headers are set on every response.

## 9. React dashboard

`dashboard/` — Vite + React 19 + Tailwind 4 + Recharts. `VITE_API_URL` points it at the
API (defaults to `http://localhost:8000`). Every API-driven view has loading, error and
empty states; a CSV upload dispatches a `dashboard-refresh` event so **all** open views
refetch — no stale numbers survive an upload.

```bash
cd dashboard && npm install && npm run dev      # http://localhost:5173
npm run build                                   # dist/
```

## 10. ML — forecasting

[`ml/forecasting.py`](ml/forecasting.py): daily `SUM(revenue)` from `fact_sales` →
features `[day_index, day_of_week, month]` → **scikit-learn `Ridge(alpha=1.0)`** →
30-day forward forecast. Confidence bands from residual σ; accuracy = `100 − MAPE`
(clamped 1.8–8.5% error). Falls back to a damped linear trend if scikit-learn is absent
or history < ~10 days. **Not XGBoost, not Prophet** — the dashboard labels it
"Ridge Regression (scikit-learn)".

## 11. Anomaly detection

[`ml/anomaly_detection.py`](ml/anomaly_detection.py): **`IsolationForest`** on
`[revenue, quantity, discount]` (contamination configurable), with a **Z-score** fallback
for small samples. Each flag gets a severity (High Risk / Warning / Normal) and a
root-cause label (excessive discount, bulk volume, under-billing, demand spike). No
synthetic anomalies — an empty result renders "No significant anomalies detected."

## 12. Explainability

[`ml/explainability.py`](ml/explainability.py): statistical correlation-based feature
attribution computed from the current data (labelled as such in the UI — it is **not** the
`shap` library). Per-anomaly explanations come from the anomaly model's root-cause logic.

## 13. GenAI recommendations

[`ml/recommendations.py`](ml/recommendations.py): computes real aggregates (top product /
category / region, discount leakage, anomaly count) and asks the **Groq** API
(`llama-3.3-70b-versatile` → fallbacks) for exactly 4 JSON recommendations. If
`GROQ_API_KEY` is unset or the call fails, a **deterministic rules engine** produces
recommendations from the same aggregates. The dashboard groups them
(Revenue / Products / Customers / Inventory / Anomalies / Growth) and labels them
"AI-generated". The key is read server-side only and never sent to the browser.

## 14. CSV upload

`POST /api/v1/ingest/upload` (or the **Data Upload** page): filename sanitised, `.csv`
only, empty/oversize rejected, cells sanitised against formula injection, rows validated,
accepted rows loaded to staging → star schema → ML re-run. Response reports rows
received / accepted / rejected and `fact_sales` totals before/after. Re-uploading the
same file is a no-op (deterministic `sale_id`).

## 15. PDF reports

[`reports/generate_pdf_report.py`](reports/generate_pdf_report.py) queries `fact_sales`
live (KPIs, date range, top products/customers, categories, regions), merges the latest
ML results, and renders a reportlab PDF. `GET /api/v1/reports/download` regenerates it on
every request (`Cache-Control: no-store`).

## 16. GitHub Actions

- [`ci.yml`](.github/workflows/ci.yml) — flake8, mypy, bandit, pytest, Docker build;
  injects `DATABASE_URL` from the secret and verifies the DB connection. No `localhost:5432`.
- [`weekly-report.yml`](.github/workflows/weekly-report.yml) — `workflow_dispatch` +
  `cron: "30 3 * * 1"` (Mon 09:00 IST). Checkout → Python → deps → verify cloud DB →
  delete old PDF + generate fresh → verify non-empty → upload artifact → email
  (subject **"Weekly Sales Analytics Report"**, fresh PDF attached). Fails on any critical step.
- [`secret-scan.yml`](.github/workflows/secret-scan.yml) — Gitleaks + TruffleHog.

## 17. Weekly email reporting

The workflow emails the **freshly generated** PDF via `dawidd6/action-send-mail`
(Gmail SMTP by default). The standalone [`reports/email_report.py`](reports/email_report.py)
does the same over SMTP for local/manual use and has a `--dry-run` mode.

## 18. Environment variables

Copy `.env.example` → `.env` (git-ignored). The real `DATABASE_URL` lives **only** in
`.env` (locally) or as a secret (CI/prod).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL URI — local Docker **or** Supabase/cloud. Single source of truth. |
| `POSTGRES_USER/PASSWORD/DB/HOST/PORT` | Fallback only if `DATABASE_URL` is unset |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | Engine pool sizing (default 3 / 2) |
| `ENVIRONMENT`, `HOST`, `PORT`, `LOG_LEVEL` | API server |
| `CORS_ORIGINS` | Comma-separated allowed origins (set to the deployed dashboard URL) |
| `GROQ_API_KEY` | Enables LLM recommendations (optional) |
| `EMAIL_USERNAME` / `EMAIL_PASSWORD` / `REPORT_RECIPIENT` / `SMTP_SERVER` / `SMTP_PORT` | Weekly email |
| `VITE_API_URL` | **Frontend** — API base URL (`dashboard/.env`) |

GitHub secrets required: `DATABASE_URL`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`,
`REPORT_RECIPIENT`, `GROQ_API_KEY` (+ optional `SMTP_SERVER`, `SMTP_PORT`).

## 19. Local setup

```bash
# 1. Database
docker compose up -d postgres pgadmin

# 2. Python
python -m venv .venv && . .venv/Scripts/activate   # or . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_platform

# 3. Schema + data
python init_db.py           # create tables
python run_pipeline.py      # extract → validate → stage → transform
python -m ml.train          # forecast + anomalies + recommendations cache

# 4. API + dashboard
uvicorn api.main:app --reload --port 8000
cd dashboard && npm install && npm run dev
```

Verify: `python verify_db_connection.py` (safe — prints host/schema/TLS/row counts, no credentials).

## 20. Cloud deployment

1. Create a Supabase project; copy the **session pooler** connection string.
2. Backend (Render / Railway / Fly / a VM): deploy this repo, set `DATABASE_URL`,
   `CORS_ORIGINS=https://<your-dashboard-domain>`, `GROQ_API_KEY`, email vars. Start
   command `gunicorn api.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   (or `docker compose --profile prod up`). `init_db.py` is safe to run on deploy.
3. Frontend (Vercel / Netlify / static host): build `dashboard/` with
   `VITE_API_URL=https://<your-api-domain>`.
4. Add the GitHub secrets above so the weekly report runs against the same database.

Nothing in production depends on `localhost`.

## 21. Security

- `.env` is git-ignored; `.env.example` holds placeholders only. No credentials in the
  repo or git history.
- Connection string read from the environment only; never logged, never returned by
  `/health` or any endpoint.
- TLS enforced for cloud databases. Non-root Docker user. Security headers on all
  responses. CSV filename sanitisation + formula-injection neutralisation + size cap.
- Errors return generic messages to clients; tracebacks stay in server logs.
- Groq key is server-side only — never exposed through `VITE_*`.
- Gitleaks + TruffleHog run in CI.

## 22. Testing

```bash
python verify_db_connection.py          # connection + tables + row counts
python run_pipeline.py && python -m ml.train
curl localhost:8000/health
curl localhost:8000/api/v1/kpis
cd dashboard && npm run build && npm run lint
```

`ci.yml` runs flake8 / mypy / bandit / pytest / Docker build on every push and PR.
`test_upload.py` and `verify_upload.py` exercise the upload path against a running API.

## 23. Known limitations

- **Forecast model** is a linear Ridge regressor — it captures trend/weekday/month
  seasonality but under-reacts to sharp regime changes; daily actuals are spiky
  (bulk-order days) so the dashboard rolls them up to weekly for readability.
- **Explainability** is correlation-based attribution, not the `shap` library.
- **Anomaly severity** thresholds are heuristic; on the bundled sample data most flags
  land in "High Risk".
- **Email** is sent only by the GitHub Actions workflow (or `reports/email_report.py`),
  not by the running API.
- Supabase's free **session pooler** caps total connections — scale via the transaction
  pooler + `DB_POOL_SIZE` for heavier load.
- The bundled `data/sample/*.csv` are generated demo data.
