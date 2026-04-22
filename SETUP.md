# LearnBox Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Optional (for LLM features)
- **Ollama** (for local LLM) - [Download](https://ollama.ai/) - OR use Groq API key

## Quick Start (Automated)

### Windows (PowerShell)
```powershell
# Run the setup script
.\setup.ps1
```

### macOS / Linux (Bash)
```bash
# Run the setup script
chmod +x setup.sh
./setup.sh
```

## Manual Setup Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd learnbox
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Backend Setup

#### 3.1 Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3.2 Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/learnbox_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Service (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# LLM Configuration (choose one)
# For Ollama (local)
OLLAMA_API_URL=http://localhost:11434

# OR for Groq (cloud)
GROQ_API_KEY=your-groq-api-key

# Optional
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!
```

#### 3.3 Setup PostgreSQL Database

**Create Database:**
```bash
# Open PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE learnbox_db;

# Exit
\q
```

**Update DATABASE_URL in .env:**
```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/learnbox_db
```

#### 3.4 Initialize Prisma
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

#### 3.5 (Optional) Seed Database
If seed scripts are available:
```bash
# Seed faculties
node seed-faculties.js

# Seed roles/permissions
node seed-rbac.js

# Seed modules
node seed-modules.js
```

#### 3.6 Start Backend Server
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

Backend will run on: **http://localhost:5000**

---

### 4. Frontend Setup

#### 4.1 Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 4.2 Configure Environment Variables
Create `.env.local` file in frontend folder:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=LearnBox
```

#### 4.3 Start Development Server
```bash
npm run dev
```

Frontend will run on: **http://localhost:5173**

#### 4.4 Build for Production
```bash
npm run build
```

---

## Verification Checklist

After setup, verify everything is working:

- [ ] Backend running on http://localhost:5000
  - Check: `http://localhost:5000/api/health` (if health endpoint exists)
  
- [ ] Frontend running on http://localhost:5173
  - Check: Landing page loads without errors
  
- [ ] Database connected
  - Backend logs show "Connected to PostgreSQL"
  
- [ ] Can access Admin Dashboard
  - Navigate to http://localhost:5000/admin
  
- [ ] Can register new user
  - Go to Landing Page → Register
  - Verify email works

- [ ] Can login
  - Use registered credentials
  - Should redirect to dashboard

## Troubleshooting

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Ensure PostgreSQL is running: `pg_isrunning` or check services
- Verify DATABASE_URL in `.env` is correct
- Check username/password

### Port Already in Use
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution:**
- Kill process on port: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)
- Or change PORT in `.env`: `PORT=5001`

### Prisma Migration Issues
```
Error: Migration failed
```
**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:reset

# Or push schema directly
npm run prisma:push
```

### Missing Dependencies
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Connect to Backend
```
CORS Error or API calls failing
```
**Solution:**
- Verify VITE_API_URL in `.env.local` matches backend URL
- Check backend CORS settings in `src/app.js`
- Ensure backend is running

### Embedding/Vectorization Not Working
**Solution:**
- Ensure `@xenova/transformers` is installed: `npm install @xenova/transformers`
- First embedding generation downloads model (~200MB)
- Check internet connection and disk space

### LLM Features Not Working
**Solution for Ollama:**
```bash
# Verify Ollama is running
ollama list

# Run a model
ollama run mistral
```

**Solution for Groq:**
- Get API key from https://console.groq.com
- Set GROQ_API_KEY in `.env`

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `super-secret-key` | JWT token signing key |
| `JWT_REFRESH_SECRET` | Yes | `refresh-secret` | Refresh token signing key |
| `CLOUDINARY_CLOUD_NAME` | Yes | `mycloud` | Cloudinary account |
| `CLOUDINARY_API_KEY` | Yes | `abc123...` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | `xyz789...` | Cloudinary API secret |
| `EMAIL_USER` | Yes | `noreply@app.com` | Email sender address |
| `EMAIL_PASSWORD` | Yes | `app-password` | Email app password |
| `OLLAMA_API_URL` | No | `http://localhost:11434` | Ollama server URL (local LLM) |
| `GROQ_API_KEY` | No | `gsk_...` | Groq API key (cloud LLM) |
| `PORT` | No | `5000` | Backend port (default: 5000) |
| `NODE_ENV` | No | `development` | Environment (development/production) |

## Production Deployment

### Backend Deployment (Render, Railway, Heroku)

1. Set environment variables in deployment platform
2. Push to Git repository
3. Connect repository to deployment service
4. Configure build command: `cd backend && npm install && npm run prisma:push`
5. Configure start command: `cd backend && npm start`

### Frontend Deployment (Render)

1. Set VITE_API_URL to production backend URL
2. Push to Git repository
3. Connect repository to deployment service
4. Build command: `cd frontend && npm run build`
5. Publish directory: `frontend/dist`

---

**Last Updated:** April 2026
