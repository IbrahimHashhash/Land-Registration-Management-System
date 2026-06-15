# Land Registration Management Information System (LRMIS)

A secure, geo-enabled platform for managing land registration services, parcel records,
field surveys, registrar review, and certificate issuance.

## Tech Stack
- **Backend:** FastAPI (Python) + PyMongo
- **Database:** MongoDB
- **Validation:** Pydantic
- **Frontend:** React
- **Maps:** Leaflet + OpenStreetMap + GeoJSON
- **API Docs:** Swagger / OpenAPI

## Modules
1. Land Application Management
2. Applicant Portal
3. Surveyor & Registrar Management
4. Analytics & Map Dashboard (group)

## Project Structure
```
backend/        FastAPI + MongoDB application
frontend/       React application
docs/           Project documentation
sample_data/    Sample MongoDB data + Postman collections
uploads/        Uploaded documents (runtime, gitignored)
```

## How the code is organized

The backend is split by feature, not by layer. Each module gets its own folder under `backend/app/features/` and owns its own files:

- `routes.py` — the API endpoints (URLs, request/response).
- `schemas.py` — Pydantic models for what comes in and what goes out.
- `service.py` — the actual logic. This is where MongoDB is read/written.
- Extra files when needed (e.g. `workflow.py` for state rules, `assignment.py` for surveyor assignment).

Rules of thumb for the team:

- Work inside your own feature folder. Don't edit files in someone else's feature.
- If your feature needs something from another feature, call its `service.py` — don't reach into its routes or DB calls.
- Keep all MongoDB queries inside `service.py`. Routes should stay thin.
- Shared things (`parcels`, `certificates`, `utils`) live at the same level so anyone can use them.

The frontend follows the same idea: `pages/` for screens, `components/` for reusable UI, `services/` for API calls. Each student builds the UI for their own module.

## Setup
See `backend/README.md` and `frontend/README.md` for setup instructions for each side.

## Team
- **Student 1:** Land Application Management
- **Student 2:** Applicant Portal
- **Student 3:** Surveyors, Registrar & Assignment
- **All:** Analytics & Map Dashboard (group module)
