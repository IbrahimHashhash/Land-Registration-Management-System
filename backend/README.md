# LRMIS Backend (FastAPI + MongoDB)

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate   (Windows)
   source venv/bin/activate  (macOS/Linux)
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in values.

4. Run the server:
   ```
   uvicorn app.main:app --reload
   ```

5. Open API docs at: http://localhost:8000/docs

## Folder Map
```
app/
├── main.py             FastAPI entry point
├── config.py           Loads env vars
├── database.py         MongoDB connection + index setup
├── dependencies.py     Shared FastAPI dependencies
├── features/           One folder per module
│   ├── applications/   Module 1
│   ├── applicants/     Module 2
│   ├── staff/          Module 3
│   ├── analytics/      Module 4
│   ├── parcels/        Shared parcel resource
│   └── certificates/   Certificate issuance
└── utils/              Generic helpers (ids, pagination, notifications)
```

## Sample Users
See `sample_data/mongodb/` for seed data.
