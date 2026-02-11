# Resource Management Feature - Implementation Guide

## 📋 Overview
This document describes the complete Resource Management feature implementation for LearnBox, allowing admins to upload PDF resources and students to filter and access them.

---

## 🗄️ Database Schema

### Updated `Resource` Table
```prisma
model Resource {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  fileUrl     String   // Cloudinary secure URL
  fileType    String   // pdf, doc, docx, ppt, pptx
  year        Int?     // Academic year (1, 2, 3, 4)
  facultyId   Int?     // Optional faculty/department reference
  moduleId    Int?
  collegeId   Int
  uploadedBy  Int
  college     College  @relation(fields: [collegeId], references: [id])
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  module      Module?  @relation(fields: [moduleId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([collegeId])
  @@index([moduleId])
  @@index([year])
  @@index([facultyId])
}
```

---

## 🚀 API Endpoints

### 1. **Upload Resource** (Admin Only)
**Endpoint:** `POST /api/resources/upload`

**Access:** `SUPER_ADMIN`, `COLLEGE_ADMIN`

**Content-Type:** `multipart/form-data`

**Request Body:**
```javascript
{
  file: File,              // PDF file (required)
  title: String,           // Resource title (required)
  description: String,     // Description (optional)
  collegeId: Number,       // College ID (required for SUPER_ADMIN, auto-filled for COLLEGE_ADMIN)
  year: Number,            // Academic year (optional)
  facultyId: Number,       // Faculty ID (optional)
  moduleId: Number         // Module ID (optional)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Resource uploaded successfully",
  "data": {
    "id": 1,
    "title": "Data Structures Notes",
    "description": "Complete notes for DS module",
    "fileUrl": "https://res.cloudinary.com/.../resource.pdf",
    "fileType": "pdf",
    "year": 2,
    "facultyId": 1,
    "moduleId": 5,
    "collegeId": 1,
    "uploadedBy": 10,
    "createdAt": "2026-01-11T10:30:00.000Z",
    "uploader": {
      "id": 10,
      "username": "admin_user",
      "first_name": "John",
      "last_name": "Doe",
      "role": "COLLEGE_ADMIN"
    },
    "module": {
      "id": 5,
      "name": "Data Structures",
      "code": "CS201"
    },
    "college": {
      "id": 1,
      "name": "MIT",
      "code": "MIT001"
    }
  }
}
```

**Validation:**
- File must be PDF, DOC, DOCX, PPT, or PPTX
- Maximum file size: 10MB
- College must exist in database
- Module must belong to the specified college (if provided)
- COLLEGE_ADMIN can only upload to their own college
- SUPER_ADMIN can upload to any college

---

### 2. **Filter Resources** (Student Access)
**Endpoint:** `GET /api/resources/filter`

**Access:** `STUDENT`, `COLLEGE_ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```
?collegeId=1&facultyId=2&year=2&moduleId=5
```

**All parameters are optional:**
- `collegeId` - Filter by college (auto-filled for students)
- `facultyId` - Filter by faculty/department
- `year` - Filter by academic year (1, 2, 3, 4)
- `moduleId` - Filter by module

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "filters": {
    "collegeId": 1,
    "facultyId": 2,
    "year": 2,
    "moduleId": 5
  },
  "data": [
    {
      "id": 1,
      "title": "Data Structures Notes",
      "description": "Complete notes for DS module",
      "fileUrl": "https://res.cloudinary.com/.../resource.pdf",
      "fileType": "pdf",
      "year": 2,
      "facultyId": 2,
      "createdAt": "2026-01-11T10:30:00.000Z",
      "module": {
        "id": 5,
        "name": "Data Structures",
        "code": "CS201"
      },
      "college": {
        "id": 1,
        "name": "MIT",
        "code": "MIT001"
      }
    }
  ]
}
```

**Security Rules:**
- Students can ONLY access resources from their own college
- Students CANNOT upload, edit, or delete resources
- Admins can filter resources from any college

---

## 🔒 Security Implementation

### Role-Based Access Control (RBAC)

#### Upload Endpoint Protection:
```javascript
router.post(
    '/upload',
    authMiddleware,                                      // Verify JWT token
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]), // Check roles
    uploadSinglePDF,                                     // Handle file upload
    handleMulterError,                                   // Handle upload errors
    uploadResource                                       // Controller logic
);
```

#### Filter Endpoint Protection:
```javascript
router.get(
    '/filter',
    authMiddleware,                                      // Verify JWT token
    requireRole([ROLES.STUDENT, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN]),
    filterResources                                      // Controller logic
);
```

### SQL Injection Prevention
All database queries use **Prisma ORM** with parameterized queries:
```javascript
const resource = await prisma.resource.create({
    data: {
        title,          // Automatically sanitized
        collegeId,      // Type-safe integer
        uploadedBy      // Type-safe integer
    }
});
```

---

## 📦 File Upload Flow

### 1. **Multer Configuration**
- Accepts PDF, DOC, DOCX, PPT, PPTX files
- Maximum size: 10MB
- Temporary storage in `/backend/uploads/`
- Unique filename generation with timestamp

### 2. **Cloudinary Upload**
- Files uploaded to folder: `learnbox/colleges/{collegeId}/resources`
- Auto-detection of file type
- Secure HTTPS URLs returned
- Local temp file deleted after upload

### 3. **Database Storage**
- Only metadata stored in PostgreSQL
- File URL points to Cloudinary CDN
- Fast retrieval with indexed queries

---

## ⚙️ Configuration

### Environment Variables (`.env`)
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Setup Instructions:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard → Settings
3. Copy Cloud Name, API Key, and API Secret
4. Update `.env` file with your credentials

---

## 🧪 Testing the Feature

### 1. **Upload Resource (Postman/cURL)**

**Using Postman:**
```
POST http://localhost:5000/api/resources/upload
Headers:
  Authorization: Bearer <admin_jwt_token>
Body (form-data):
  file: [Select PDF file]
  title: "Data Structures Notes"
  description: "Complete module notes"
  year: 2
  moduleId: 5
```

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/resources/upload \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -F "file=@/path/to/file.pdf" \
  -F "title=Data Structures Notes" \
  -F "description=Complete module notes" \
  -F "year=2" \
  -F "moduleId=5"
```

### 2. **Filter Resources (Student)**

**Using Postman:**
```
GET http://localhost:5000/api/resources/filter?year=2&moduleId=5
Headers:
  Authorization: Bearer <student_jwt_token>
```

**Using cURL:**
```bash
curl http://localhost:5000/api/resources/filter?year=2&moduleId=5 \
  -H "Authorization: Bearer <student_jwt_token>"
```

---

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── cloudinary.config.js      # Cloudinary setup
│   ├── controllers/
│   │   └── resource.controller.js    # Upload & filter logic
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── role.middleware.js        # RBAC enforcement
│   │   └── upload.middleware.js      # Multer configuration
│   └── routes/
│       └── resource.routes.js        # API endpoints
├── uploads/                          # Temp file storage
├── prisma/
│   └── schema.prisma                # Database schema
└── .env                             # Environment variables
```

---

## 🔍 Error Handling

### Upload Errors:
| Error | Status | Message |
|-------|--------|---------|
| No file | 400 | "No file uploaded. Please upload a PDF file." |
| Missing title | 400 | "Title is required" |
| Invalid file type | 400 | "Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed." |
| File too large | 400 | "File too large. Maximum size is 10MB." |
| College not found | 404 | "College not found" |
| Module not found | 404 | "Module not found" |
| Module-college mismatch | 400 | "Module does not belong to the specified college" |
| Cloudinary error | 500 | "Failed to upload file to cloud storage" |

### Filter Errors:
| Error | Status | Message |
|-------|--------|---------|
| Student without college | 400 | "Student must be associated with a college" |
| Database error | 500 | "Database error occurred" |

---

## 🎯 Key Features Implemented

✅ **Admin Upload with Cloudinary Integration**
- File validation (type, size)
- Secure cloud storage
- Automatic metadata extraction
- College and module validation

✅ **Student Filtering System**
- College-scoped access (automatic)
- Multi-parameter filtering
- Fast indexed queries
- Clean JSON responses

✅ **Security & Authorization**
- JWT authentication on all routes
- Role-based access control (RBAC)
- College-scoped data isolation
- Parameterized SQL queries (Prisma)

✅ **Production-Ready Code**
- Comprehensive error handling
- Clean MVC architecture
- Well-commented code
- RESTful API design

---

## 📚 Usage Examples

### Example 1: Admin Uploads Year 2 Resource
```javascript
// Admin uploads a PDF for Year 2 students
POST /api/resources/upload
{
  file: computer_networks.pdf,
  title: "Computer Networks Chapter 1",
  description: "Introduction to networking concepts",
  year: 2,
  facultyId: 3,
  moduleId: 8
}

// Response: Resource uploaded successfully with Cloudinary URL
```

### Example 2: Student Filters Year 2 Resources
```javascript
// Year 2 student searches for their resources
GET /api/resources/filter?year=2

// Response: All Year 2 resources from student's college
{
  "count": 15,
  "data": [...resources...]
}
```

### Example 3: Student Filters by Module
```javascript
// Student searches for specific module
GET /api/resources/filter?moduleId=8

// Response: All resources for module 8 from student's college
```

---

## 🚨 Important Notes

1. **Cloudinary Credentials Required:**
   - You must add valid Cloudinary credentials to `.env`
   - Without them, file uploads will fail

2. **Database Migration:**
   - Run `npx prisma db push` to apply schema changes
   - Run `npx prisma generate` to update Prisma client

3. **File Storage:**
   - Files are temporarily stored locally before Cloudinary upload
   - Local files are automatically deleted after successful upload
   - Ensure `/backend/uploads/` directory has write permissions

4. **Role Requirements:**
   - Users must have proper roles assigned in the database
   - Students must be associated with a college (collegeId)

---

## 🔧 Troubleshooting

### Issue: "Cloudinary upload failed"
**Solution:** Check `.env` for correct Cloudinary credentials

### Issue: "Student must be associated with a college"
**Solution:** Ensure student user has `collegeId` set in database

### Issue: "Module does not belong to college"
**Solution:** Verify module and college IDs match in database

### Issue: "File too large"
**Solution:** Compress PDF or increase size limit in `upload.middleware.js`

---

## 📞 Support

For issues or questions:
1. Check error messages in server console
2. Verify JWT token is valid and not expired
3. Ensure database schema is up to date
4. Verify Cloudinary configuration

---

**Implementation Date:** January 11, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
