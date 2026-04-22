"# LearnBox

A comprehensive educational platform for managing learning resources, conducting assessments, and tracking student progress.

## Overview

LearnBox is a full-stack application providing educators and students with tools for resource management, interactive learning, and performance analytics. The platform supports multiple user roles, semantic search capabilities, and cloud-based file storage.

## Tech Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite build tool
- TailwindCSS for styling

**Backend:**
- Node.js with Express.js 5.2.1
- PostgreSQL 14+ database
- Prisma 6.19.1 ORM

**Infrastructure:**
- Docker and Docker Compose for containerization
- Cloudinary for media storage
- Vectra for vector database
- JWT for authentication

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- PostgreSQL 14 or higher
- Git

## Quick Start

### Automated Setup

**Windows:**
```powershell
.\setup.ps1
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Configure environment:
   ```bash
   cp backend/.env.example backend/.env
   # Update backend/.env with your credentials
   ```

3. Setup database:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:push
   ```

4. Start services:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. Access application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Admin Panel: http://localhost:5000/admin

## Project Structure

```
learnbox/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Data operations
│   │   ├── middleware/     # Auth, uploads
│   │   └── config/         # Service configs
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── context/        # Global state
│   └── package.json
├── SETUP.md                 # Setup guide
└── DOCKER.md                # Docker documentation
```

## Core Features

- User authentication with JWT and role-based access control
- Resource management with cloud storage integration
- Learning site creation and module organization
- MCQ and quiz management with scoring
- Semantic search using vector embeddings
- Analytics and audit logging
- Admin dashboard for system management

## Configuration

Environment variables required for backend/.env:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for token signing
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary account
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

See [SETUP.md](./SETUP.md) for complete environment configuration.

## Development

### Backend Commands

```bash
cd backend

npm run dev              # Development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run seed             # Run database seeders
```

### Frontend Commands

```bash
cd frontend

npm run dev              # Development server
npm run build            # Build for production
npm run preview          # Preview production build
```

## Troubleshooting

For setup issues, see [SETUP.md](./SETUP.md#troubleshooting).

Common problems:
- Backend won't start: Verify PostgreSQL is running and DATABASE_URL is correct
- Frontend errors: Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Database connection failed: Check PostgreSQL credentials and ensure database exists

## API Documentation

API endpoints reference: See [API_TEST_CASES.md](./backend/API_TEST_CASES.md)

## Support

1. Check [SETUP.md](./SETUP.md) for setup problems
2. Review [DOCKER.md](./DOCKER.md) for containerization issues
3. See [API_TEST_CASES.md](./backend/API_TEST_CASES.md) for API questions

## License

This project is provided as-is for educational and organizational purposes." 
