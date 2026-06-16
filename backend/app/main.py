from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.database
from app.features.applicants.routes import router as applicants_router

app = FastAPI(title="LRMIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applicants_router)

@app.get("/")
def root():
    return {"status": "ok"}
