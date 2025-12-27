Write-Host "🎨 Starting GlamAI Backend Server..." -ForegroundColor Magenta
Write-Host ""

# -------------------------------
# Check virtual environment
# -------------------------------
if (-Not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run:"
    Write-Host "  python -m venv venv"
    Write-Host "  venv\Scripts\activate"
    Write-Host "  pip install -r requirements.txt"
    exit 1
}

# -------------------------------
# Activate virtual environment
# -------------------------------
Write-Host "🐍 Activating virtual environment..."
& "venv\Scripts\Activate.ps1"

# -------------------------------
# Check .env file
# -------------------------------
if (-Not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure it"
    exit 1
}

# -------------------------------
# Check database connection
# -------------------------------
Write-Host "🔍 Checking database connection..."

python -c "from app.db.database import sync_engine; sync_engine.connect()" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database connection failed!" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env"
    exit 1
}

Write-Host "✅ Database connection successful" -ForegroundColor Green

# -------------------------------
# Run migrations
# -------------------------------
Write-Host "📊 Running database migrations..."
alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Alembic migration failed!" -ForegroundColor Red
    exit 1
}

# -------------------------------
# Server info
# -------------------------------
Write-Host ""
Write-Host "🚀 Starting FastAPI server..."
Write-Host "📝 API Docs: http://localhost:8000/docs"
Write-Host "🔧 Health Check: http://localhost:8000/health"
Write-Host ""

# -------------------------------
# Environment mode
# -------------------------------
if ($env:ENVIRONMENT -eq "production") {
    Write-Host "🌐 Running in PRODUCTION mode..." -ForegroundColor Yellow

    gunicorn app.main:app `
        --workers 4 `
        --worker-class uvicorn.workers.UvicornWorker `
        --bind 0.0.0.0:8000 `
        --log-level info `
        --access-logfile logs/access.log `
        --error-logfile logs/error.log
}
else {
    Write-Host "🔧 Running in DEVELOPMENT mode..." -ForegroundColor Cyan
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}
