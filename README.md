# Land Registration Management Information System (LRMIS)

A secure, geo-enabled platform for managing land registration services,
parcel records, field surveys, registrar review, and certificate issuance.

## Stack

- **Backend:** FastAPI (Python) + PyMongo
- **Database:** MongoDB
- **Validation:** Pydantic
- **Frontend:** React (Vite)
- **Maps:** Leaflet + OpenStreetMap + GeoJSON
- **API docs:** Swagger / OpenAPI (auto-generated at `/docs`)

## Project layout

```
backend/             FastAPI + MongoDB application
frontend/            React application
docs/                Workflow / database / API documentation
sample_data/         Sample MongoDB JSON + Postman collection
uploads/             Uploaded documents (runtime, gitignored)
```

The backend is organised by feature, not by layer
(`backend/app/features/{applications, applicants, staff, analytics, certificates}`).
Each feature owns its own `routes.py`, `schemas.py`, and `service.py`.

## Modules

1. Land Application Management
2. Applicant Portal
3. Surveyor & Registrar Management
4. Analytics & Map Dashboard

## Quick start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+ running locally (or a connection string to a remote cluster)

### 2. Backend
```
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

copy .env.example .env         # then edit .env if needed
python seed_demo_data.py       # seeds 12 applications across all statuses
uvicorn app.main:app --reload
```
- API:           http://localhost:8000
- Swagger docs:  http://localhost:8000/docs

### 3. Frontend
```
cd frontend
copy .env.example .env         # set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```
- App: http://localhost:5173

## Environment variables

### `backend/.env`
| Variable        | Default                       | Purpose                                          |
|-----------------|-------------------------------|--------------------------------------------------|
| `MONGO_URI`     | `mongodb://localhost:27017`   | MongoDB connection string                        |
| `MONGO_DB_NAME` | `lrmis`                       | Database name                                    |
| `APP_NAME`      | `LRMIS`                       | Display name                                     |
| `APP_ENV`       | `development`                 | Environment label                                |
| `SECRET_KEY`    | `change-me`                   | Reserved for future signed tokens                |
| `UPLOAD_DIR`    | `../uploads`                  | Where uploaded documents will be stored          |

### `frontend/.env`
| Variable        | Default                       | Purpose                                          |
|-----------------|-------------------------------|--------------------------------------------------|
| `VITE_API_URL`  | `http://localhost:8000`       | Backend API base URL                             |

## Sample users (after running `seed_demo_data.py`)

### Applicants — sign in at `/applicant/login` with the National ID

| National ID | Name           | Type           | Has applications |
|-------------|----------------|----------------|------------------|
| `990000001` | Nour Ahmad     | citizen        | yes |
| `990000002` | Khaled Mansour | lawyer         | yes |
| `990000003` | Lina Haddad    | citizen        | yes |
| `990000004` | Tariq Saleh    | representative | yes |
| `990000005` | Omar Khalil    | company        | yes |
| `990000006` | Huda Nasser    | citizen        | yes |

### Staff — sign in at `/staff/login` (registrar) and `/surveyor/login` (surveyor)

The staff console picks from any documents in `staff_members`. After running
the demo seed there are no registrars/surveyors loaded; create them via the
sample data import:

```
mongoimport --uri "mongodb://localhost:27017" --db lrmis --collection staff_members --file sample_data/mongodb/staff_members.json --jsonArray
```

This loads `SURV-RM-04`, `SURV-RM-05`, and `REG-RM-09`.

## Workflow

The state machine is enforced server-side. See
[`docs/workflow/state-machine.md`](docs/workflow/state-machine.md):

```
submitted -> pre_checked -> survey_required -> surveyed
          -> legal_review -> approved -> certificate_issued -> closed
```

with alternative states `rejected`, `on_hold`, `missing_documents`, `under_objection`.

## Documentation

- [`docs/api/endpoints.md`](docs/api/endpoints.md) — Full endpoint reference.
- [`docs/database/schema.md`](docs/database/schema.md) — Collections, indexes, sample documents.
- [`docs/workflow/state-machine.md`](docs/workflow/state-machine.md) — State machine, transition rules, milestones.
- Swagger UI at `/docs` is the live, auto-generated reference.

## Sample data and Postman

- `sample_data/mongodb/*.json` — One file per collection. Import with `mongoimport` (see [`sample_data/README.md`](sample_data/README.md)).
- `sample_data/postman/LRMIS.postman_collection.json` — Postman collection covering every endpoint.

## Tests

End-to-end test suite (requires a running MongoDB):

```
cd backend
python tests/test_full_flow.py
```

Covers all four modules, all required endpoints, every workflow rule, and
each behavioural fix. Should print `92/92 checks passed`.

## Module ownership (course context)

- **Student 1 — Applicant Portal:** the React applicant module + relevant backend feature.
- **Student 2 — Staff & Registrar Console:** Application management, details, registrar review, certificate issuance.
- **Student 3 — Surveyor + Map + Analytics:** Field tasks, live parcel map, analytics dashboards.
- **Group:** the analytics dashboard and live map are shared.
