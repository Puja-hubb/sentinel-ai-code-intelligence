from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="SentinelAI API",
    description="Code intelligence and verification platform API.",
    version="0.1.0",
)

# Local development origins. Tighten this list for production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {"message": "SentinelAI API is running", "docs": "/docs"}


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="sentinel-ai-api", version="0.1.0")
