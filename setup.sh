#!/bin/bash

# LearnBox Automated Setup Script for macOS/Linux (Bash)
# This script automates the setup process for both backend and frontend

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Output functions
print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_custom_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_info() {
    echo -e "${CYAN}[INFO] $1${NC}"
}

print_custom_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_header() {
    echo -e "${MAGENTA}===============================================${NC}"
    echo -e "${MAGENTA}    LearnBox Project Setup${NC}"
    echo -e "${MAGENTA}    Automated Installation Script${NC}"
    echo -e "${MAGENTA}===============================================${NC}"
}

# Parse arguments
SKIP_DATABASE=false
DATABASE_NAME="learnbox_db"
DATABASE_USER="postgres"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-database)
            SKIP_DATABASE=true
            shift
            ;;
        --db-name)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --db-user)
            DATABASE_USER="$2"
            shift 2
            ;;
        *)
            print_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# Header
print_header

# 1. Check Prerequisites
print_info "Checking prerequisites...\n"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_custom_error "Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_custom_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm found: $NPM_VERSION"

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git found: $GIT_VERSION"
else
    print_custom_warning "Git is not found. This may be needed for some operations."
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    print_success "PostgreSQL found: $PG_VERSION"
else
    print_custom_warning "PostgreSQL not found. You'll need to set up the database manually."
fi

print_info "All prerequisites checked!\n"

# 2. Install Root Dependencies
print_info "Installing root dependencies..."
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_success "Root dependencies installed"
    else
        print_custom_error "Failed to install root dependencies"
        exit 1
    fi
fi

# 3. Backend Setup
print_info "Setting up backend...\n"

if [ ! -d "backend" ]; then
    print_custom_error "Backend folder not found!"
    exit 1
fi

cd backend

# 3.1 Install backend dependencies
print_info "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_custom_error "Failed to install backend dependencies"
    cd ..
    exit 1
fi
print_success "Backend dependencies installed"

# 3.2 Check for .env file
print_info "Checking backend environment configuration..."
if [ ! -f ".env" ]; then
    print_custom_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_custom_warning "Created .env from .env.example. Please edit it with your configuration."
    else
        print_custom_warning "No .env.example found. Creating basic .env template..."
        cat > .env << 'EOF'
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
EOF
        print_custom_warning "Created basic .env file. Please update with your credentials."
    fi
else
    print_success ".env file found"
fi

# 3.3 Generate Prisma Client
print_info "Generating Prisma client..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    print_custom_error "Failed to generate Prisma client"
    cd ..
    exit 1
fi
print_success "Prisma client generated"

# 3.4 Database setup
if [ "$SKIP_DATABASE" = false ]; then
    print_info "Setting up database...\n"
    
    if command -v psql &> /dev/null; then
        print_info "Attempting to push Prisma schema to database..."
        npm run prisma:push
        if [ $? -eq 0 ]; then
            print_success "Database schema pushed successfully"
        else
            print_custom_error "Failed to push database schema"
            print_custom_warning "You may need to:"
            print_custom_warning "  1. Create the database manually in PostgreSQL"
            print_custom_warning "  2. Update DATABASE_URL in .env"
            print_custom_warning "  3. Run: npm run prisma:push"
        fi
    else
        print_custom_warning "PostgreSQL not available. Skipping database setup."
        print_info "Manual database setup required:"
        print_info "  1. Install PostgreSQL (macOS: brew install postgresql, Linux: apt-get install postgresql)"
        print_info "  2. Create database: CREATE DATABASE $DATABASE_NAME;"
        print_info "  3. Update DATABASE_URL in backend/.env"
        print_info "  4. Run: npm run prisma:push"
    fi
fi

cd ..
print_success "Backend setup complete\n"

# 4. Frontend Setup
print_info "Setting up frontend...\n"

if [ ! -d "frontend" ]; then
    print_custom_error "Frontend folder not found!"
    exit 1
fi

cd frontend

# 4.1 Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_custom_error "Failed to install frontend dependencies"
    cd ..
    exit 1
fi
print_success "Frontend dependencies installed"

# 4.2 Check for .env.local
print_info "Checking frontend environment configuration..."
if [ ! -f ".env.local" ]; then
    print_info "Creating .env.local..."
    cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=LearnBox
EOF
    print_success "Created .env.local"
else
    print_success ".env.local file found"
fi

cd ..
print_success "Frontend setup complete\n"

# 5. Summary and Next Steps
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}         Setup Complete${NC}"
echo -e "${GREEN}===============================================${NC}"

print_info "Next steps:\n"
echo "1. Review and update configuration files:"
echo "   - backend/.env (Database, API keys, etc.)"
echo "   - frontend/.env.local (API URL)\n"

echo "2. Start the backend:"
echo "   cd backend"
echo "   npm run dev\n"

echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev\n"

echo "4. Access the application:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend: http://localhost:5000"
echo "   - Admin: http://localhost:5000/admin\n"

print_custom_warning "Important:"
print_custom_warning "- Update backend/.env with your Cloudinary, Email, and Database credentials"
print_custom_warning "- For LLM features, install either Ollama or get a Groq API key"
print_custom_warning "- Ensure PostgreSQL is running before starting the backend\n"

print_success "Setup script completed successfully!"
print_info "For detailed documentation, see SETUP.md"
