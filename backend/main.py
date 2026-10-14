from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection, init_database

# =====================================================
# LIFESPAN: Modern FastAPI pattern (replaces deprecated @app.on_event)
# =====================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    - Startup: Initialize database tables
    - Shutdown: Cleanup if needed
    """
    # Startup
    print("🚀 Starting TeamMatch API...")
    init_database()
    print("✅ Database initialized")
    
    yield  # Application runs here
    
    # Shutdown (if needed)
    print("👋 Shutting down TeamMatch API...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="TeamMatch API",
    description="API for TeamMatch data (profiles, availability, assignments, group members) with Supabase authentication",
    version="1.0.0",
    lifespan=lifespan
)

# =====================================================
# CORS CONFIGURATION
# Allows React frontend at http://localhost:5173 to call the API
# In production, restrict origins to your actual frontend domain
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROUTERS
# Import and include route modules
# =====================================================
from auth import router as auth_router
from teammatch import router as teammatch_router

app.include_router(auth_router)
app.include_router(teammatch_router)


# =====================================================
# ROOT ENDPOINTS
# =====================================================
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the TeamMatch API",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)