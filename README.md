"# LearnBox

A web-based academic learning platform designed for university students to access educational resources, practice MCQs, and manage academic content efficiently.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with access and refresh tokens
- **Role-Based Access**: Support for Super Admin, College Admin, and Student roles
- **Protected Routes**: Client-side route protection for authenticated users
- **Admin Panel**: Powered by AdminJS for easy database management
- **Responsive UI**: Modern interface built with React and Tailwind CSS
- **Type-Safe**: TypeScript implementation for better code quality

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v22.17.0
- **Framework**: Express v5.2.1
- **Database**: PostgreSQL with Prisma ORM v6.19.1
- **Authentication**: JWT (jsonwebtoken, bcryptjs)
- **Admin Panel**: AdminJS v7.8.1
- **ES Modules**: Modern JavaScript module system

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite v6.3.5
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Routing**: React Router v7.11.0
- **HTTP Client**: Axios
- **Icons**: Lucide React, Material-UI Icons

## 📋 Prerequisites

- Node.js v22.x or higher
- PostgreSQL database
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd learnbox
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://learnbox_user:learnbox_user@localhost:5432/learnbox_db?schema=public
ACCESS_TOKEN_SECRET=your_secure_access_secret_here
REFRESH_TOKEN_SECRET=your_secure_refresh_secret_here
PORT=5000
```

### 3. Database Setup

Create PostgreSQL user and database:
```sql
CREATE USER learnbox_user WITH PASSWORD 'learnbox_user';
CREATE DATABASE learnbox_db OWNER learnbox_user;
GRANT ALL PRIVILEGES ON DATABASE learnbox_db TO learnbox_user;
```

Push schema to database:
```bash
npx prisma db push
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## 🚦 Running the Application

### Start Backend Server
```bash
cd backend
node src/app.js
```
Backend will run on http://localhost:5000

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

### Access Admin Panel
Navigate to http://localhost:5000/admin

## 📁 Project Structure

```
learnbox/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   ├── middleware/            # Auth & role middleware
│   │   ├── routes/                # API routes
│   │   ├── utils/                 # Helper functions
│   │   ├── admin.js               # AdminJS configuration
│   │   ├── app.js                 # Express app entry point
│   │   ├── config.js              # Environment config
│   │   └── prisma.js              # Prisma client
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Reusable components
│   │   │   ├── pages/             # Page components
│   │   │   └── App.tsx            # Main app component
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Authentication context
│   │   ├── services/
│   │   │   └── api.ts             # API client & endpoints
│   │   ├── styles/                # Global styles
│   │   └── main.tsx               # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔑 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new user account | No |
| POST | `/login` | Authenticate user | No |
| POST | `/token/refresh` | Refresh access token | No |
| GET | `/me` | Get current user info | Yes |

### Request/Response Examples

**Register**
```json
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}

Response:
{
  "message": "User created successfully",
  "tokens": {
    "access": "eyJhbGc...",
    "refresh": "eyJhbGc..."
  },
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["STUDENT"]
  }
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

Response: (same as register)
```

## 🔐 Authentication Flow

1. **Registration**: User creates account → Receives JWT tokens → Redirected to login
2. **Login**: User submits credentials → Tokens stored in localStorage → Redirected to dashboard
3. **Protected Routes**: Automatic token validation → Token refresh on expiry → Logout on failure
4. **Token Refresh**: Automatic via Axios interceptor on 401 responses

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String   @unique
  email      String   @unique
  password   String
  first_name String?
  last_name  String?
  roles      Role[]   @default([STUDENT])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum Role {
  SUPER_ADMIN
  COLLEGE_ADMIN
  STUDENT
}
```

## 🎨 Frontend Pages

- **Landing Page** (`/`): Marketing page with platform overview
- **Login Page** (`/login`): User authentication
- **Register Page** (`/register`): New user registration
- **Dashboard** (`/dashboard`): Protected user dashboard

## 🔒 Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT access tokens (short-lived)
- JWT refresh tokens (long-lived)
- Protected API routes with middleware
- CORS enabled for frontend-backend communication
- Automatic token refresh on expiry

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check if port 5000 is available

### Frontend compilation errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Database connection failed
- Verify PostgreSQL credentials
- Ensure database and user exist
- Check firewall/port settings

### CORS errors
- Ensure backend is running on port 5000
- Verify frontend is accessing correct backend URL

## 📝 Development Notes

- Backend uses ES Modules (`"type": "module"` in package.json)
- .env file must be UTF-8 encoded without BOM
- Prisma client auto-generated after schema changes
- Frontend uses Vite for fast HMR and builds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

LearnBox Development Team

---

**Version**: 0.0.1  
**Last Updated**: December 2025" 
