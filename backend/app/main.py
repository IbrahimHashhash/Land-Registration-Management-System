from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.database  # runs on import: connects to MongoDB and creates indexes

app = FastAPI(title="LRMIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}
