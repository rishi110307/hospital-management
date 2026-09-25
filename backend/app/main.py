from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db
from .seed_data import seed_database
from .routers import (
    auth,
    patients,
    doctors,
    appointments,
    queue,
    medical_records,
    laboratory,
    pharmacy,
    beds,
    emergency,
    blood_bank,
    billing,
    ai_tools,
    resources,
    analytics,
    audit
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database & seed demo accounts if empty
    print("Initializing SmartCare database...")
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="SmartCare HMS API",
    description="Production-style backend REST API for SmartCare Hospital Management & Patient Care Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(queue.router)
app.include_router(medical_records.router)
app.include_router(laboratory.router)
app.include_router(pharmacy.router)
app.include_router(beds.router)
app.include_router(emergency.router)
app.include_router(blood_bank.router)
app.include_router(billing.router)
app.include_router(ai_tools.router)
app.include_router(resources.router)
app.include_router(analytics.router)
app.include_router(audit.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "operational",
        "service": "SmartCare HMS Backend",
        "version": "2.0.0",
        "database": "SQLite Relational Storage"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
