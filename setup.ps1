# LearnBox Automated Setup Script for Windows (PowerShell)
# This script automates the setup process for both backend and frontend

param(
    [switch]$SkipNodeCheck = $false,
    [switch]$SkipDatabase = $false,
    [string]$DatabaseName = "learnbox_db",
    [string]$DatabaseUser = "postgres",
    [switch]$Interactive = $true
)

# Color functions for output
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-CustomError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-CustomWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Header
Write-Host @"
===============================================
    LearnBox Project Setup
    Automated Installation Script
===============================================
"@ -ForegroundColor Magenta

# 1. Check Prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js
if (-not $SkipNodeCheck) {
    $nodeVersion = node --version 2>$null
    if ($null -eq $nodeVersion) {
        Write-CustomError "Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
        exit 1
    }
    Write-Success "Node.js found: $nodeVersion"
}

# Check npm
$npmVersion = npm --version 2>$null
if ($null -eq $npmVersion) {
    Write-CustomError "npm is not installed"
    exit 1
}
Write-Success "npm found: $npmVersion"

# Check Git
$gitVersion = git --version 2>$null
if ($null -eq $gitVersion) {
    Write-CustomWarning "Git is not found. This may be needed for some operations."
}
else {
    Write-Success "Git found: $gitVersion"
}

# Check PostgreSQL
$pgVersion = psql --version 2>$null
if ($null -eq $pgVersion) {
    Write-CustomWarning "PostgreSQL not found. You'll need to set up the database manually."
}
else {
    Write-Success "PostgreSQL found: $pgVersion"
}

Write-Info "All prerequisites checked!`n"

# 2. Install Root Dependencies
Write-Info "Installing root dependencies..."
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Root dependencies installed"
    }
    else {
        Write-CustomError "Failed to install root dependencies"
        exit 1
    }
}

# 3. Backend Setup
Write-Info "Setting up backend...`n"

if (-not (Test-Path "backend")) {
    Write-CustomError "Backend folder not found!"
    exit 1
}

Push-Location backend

# 3.1 Install backend dependencies
Write-Info "Installing backend dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-CustomError "Failed to install backend dependencies"
    Pop-Location
    exit 1
}
Write-Success "Backend dependencies installed"

# 3.2 Check for .env file
Write-Info "Checking backend environment configuration..."
if (-not (Test-Path ".env")) {
    Write-CustomWarning ".env file not found. Creating from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-CustomWarning "Created .env from .env.example. Please edit it with your configuration."
    }
    else {
        Write-CustomWarning "No .env.example found. Creating basic .env template..."
        @"
# Database
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/learnbox_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# LLM (choose one)
OLLAMA_API_URL=http://localhost:11434
# OR
# GROQ_API_KEY=your-groq-api-key

# Server
PORT=5000
NODE_ENV=development
"@ | Out-File ".env" -Encoding UTF8
        Write-CustomWarning "Created basic .env file. Please update with your credentials."
    }
}
else {
    Write-Success ".env file found"
}

# 3.3 Generate Prisma Client
Write-Info "Generating Prisma client..."
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-CustomError "Failed to generate Prisma client"
    Pop-Location
    exit 1
}
Write-Success "Prisma client generated"

# 3.4 Database setup
if (-not $SkipDatabase) {
    Write-Info "Setting up database...`n"
    
    if ($pgVersion) {
        Write-Info "Attempting to push Prisma schema to database..."
        npm run prisma:push
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database schema pushed successfully"
        }
        else {
            Write-CustomError "Failed to push database schema"
            Write-CustomWarning "You may need to:"
            Write-CustomWarning "  1. Create the database manually in PostgreSQL"
            Write-CustomWarning "  2. Update DATABASE_URL in .env"
            Write-CustomWarning "  3. Run: npm run prisma:push"
        }
    }
    else {
        Write-CustomWarning "PostgreSQL not available. Skipping database setup."
        Write-Info "Manual database setup required:"
        Write-Info "  1. Install PostgreSQL from https://www.postgresql.org/download/"
        Write-Info "  2. Create database: CREATE DATABASE learnbox_db;"
        Write-Info "  3. Update DATABASE_URL in backend/.env"
        Write-Info "  4. Run: npm run prisma:push"
    }
}

Pop-Location
Write-Success "Backend setup complete`n"

# 4. Frontend Setup
Write-Info "Setting up frontend...`n"

if (-not (Test-Path "frontend")) {
    Write-CustomError "Frontend folder not found!"
    exit 1
}

Push-Location frontend

# 4.1 Install frontend dependencies
Write-Info "Installing frontend dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-CustomError "Failed to install frontend dependencies"
    Pop-Location
    exit 1
}
Write-Success "Frontend dependencies installed"

# 4.2 Check for .env.local
Write-Info "Checking frontend environment configuration..."
if (-not (Test-Path ".env.local")) {
    Write-Info "Creating .env.local..."
    @"
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=LearnBox
"@ | Out-File ".env.local" -Encoding UTF8
    Write-Success "Created .env.local"
}
else {
    Write-Success ".env.local file found"
}

Pop-Location
Write-Success "Frontend setup complete`n"

# 5. Summary and Next Steps
Write-Host @"
===============================================
         Setup Complete
===============================================
"@ -ForegroundColor Green

Write-Info "Next steps:`n"
Write-Host "1. Review and update configuration files:"
Write-Host "   - backend/.env (Database, API keys, etc.)"
Write-Host "   - frontend/.env.local (API URL)`n"

Write-Host "2. Start the backend:"
Write-Host "   cd backend"
Write-Host "   npm run dev`n"

Write-Host "3. In a new terminal, start the frontend:"
Write-Host "   cd frontend"
Write-Host "   npm run dev`n"

Write-Host "4. Access the application:"
Write-Host "   - Frontend: http://localhost:5173"
Write-Host "   - Backend: http://localhost:5000"
Write-Host "   - Admin: http://localhost:5000/admin`n"

Write-CustomWarning "Important:"
Write-CustomWarning "- Update backend/.env with your Cloudinary, Email, and Database credentials"
Write-CustomWarning "- For LLM features, install either Ollama or get a Groq API key"
Write-CustomWarning "- Ensure PostgreSQL is running before starting the backend`n"

Write-Success "Setup script completed successfully!"
Write-Info "For detailed documentation, see SETUP.md"
