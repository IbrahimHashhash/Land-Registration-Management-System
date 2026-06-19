from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.database
from app.features.applicants.routes import router as applicants_router
from app.features.applicants.application_routes import router as applications_router
from app.features.staff.routes import router as staff_router, app_router as staff_app_router
from app.features.analytics.routes import router as analytics_router

app = FastAPI(title="LRMIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applicants_router)
app.include_router(applications_router)
app.include_router(staff_router)
app.include_router(staff_app_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {"status": "ok"}
