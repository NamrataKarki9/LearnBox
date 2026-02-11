# 📊 Resource Management - Visual Architecture

## 🔄 Upload Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN UPLOADS RESOURCE                        │
└─────────────────────────────────────────────────────────────────┘

1. Admin (Postman/Frontend)
   │
   ├─ Headers: Authorization: Bearer <admin_jwt>
   ├─ Body: FormData
   │   ├─ file: document.pdf
   │   ├─ title: "Data Structures Notes"
   │   ├─ year: 2
   │   └─ moduleId: 5
   │
   ▼
2. POST /api/resources/upload
   │
   ├─ authMiddleware() ───────── Verify JWT token
   │   └─ Decode token → req.user = { id, role, collegeId }
   │
   ├─ requireRole([ADMIN]) ───── Check if SUPER_ADMIN or COLLEGE_ADMIN
   │   └─ If STUDENT → Return 403 Forbidden
   │
   ├─ uploadSinglePDF() ────────── Multer middleware
   │   ├─ Check file type (PDF, DOC, DOCX, PPT, PPTX)
   │   ├─ Check file size (max 10MB)
   │   ├─ Save to: /backend/uploads/resource-<timestamp>.pdf
   │   └─ Attach to: req.file
   │
   └─ handleMulterError() ──────── Handle upload errors
   │
   ▼
3. uploadResource() Controller
   │
   ├─ Validate required fields (title, file)
   │
   ├─ Validate College
   │   ├─ Query: prisma.college.findUnique(collegeId)
   │   └─ If not found → 404 Error
   │
   ├─ Validate Module (if provided)
   │   ├─ Query: prisma.module.findUnique(moduleId)
   │   ├─ Check: module.collegeId === collegeId
   │   └─ If mismatch → 400 Error
   │
   ├─ Upload to Cloudinary
   │   ├─ Call: uploadToCloudinary(req.file.path)
   │   ├─ Folder: learnbox/colleges/{collegeId}/resources
   │   ├─ Get: secure_url, public_id, format, bytes
   │   └─ Delete local file: unlink(req.file.path)
   │
   └─ Save to Database
       ├─ prisma.resource.create({
       │     title, description, fileUrl, fileType,
       │     year, facultyId, moduleId, collegeId, uploadedBy
       │  })
       └─ Return: 201 Created with resource data
   │
   ▼
4. Response to Admin
   └─ { success: true, data: { id, title, fileUrl, ... } }
```

---

## 🔍 Filter Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  STUDENT FILTERS RESOURCES                       │
└─────────────────────────────────────────────────────────────────┘

1. Student (Frontend)
   │
   ├─ Headers: Authorization: Bearer <student_jwt>
   ├─ Query: ?year=2&moduleId=5
   │
   ▼
2. GET /api/resources/filter
   │
   ├─ authMiddleware() ───────── Verify JWT token
   │   └─ Decode token → req.user = { id, role, collegeId }
   │
   ├─ requireRole([STUDENT]) ──── Check if STUDENT role
   │   └─ If ADMIN tries → Still allowed
   │
   ▼
3. filterResources() Controller
   │
   ├─ Build Where Clause
   │   ├─ If STUDENT:
   │   │   └─ collegeId = req.user.collegeId (auto-scoped)
   │   ├─ If ADMIN:
   │   │   └─ collegeId = req.query.collegeId (optional)
   │   │
   │   ├─ Add optional filters:
   │   │   ├─ year = parseInt(req.query.year)
   │   │   ├─ facultyId = parseInt(req.query.facultyId)
   │   │   └─ moduleId = parseInt(req.query.moduleId)
   │
   ├─ Query Database
   │   ├─ prisma.resource.findMany({
   │   │     where: { collegeId, year, facultyId, moduleId },
   │   │     select: { id, title, description, fileUrl, ... },
   │   │     orderBy: { createdAt: 'desc' }
   │   │  })
   │   └─ Use indexes for fast filtering
   │
   └─ Return Results
       └─ { success: true, count: 15, data: [...resources] }
   │
   ▼
4. Response to Student
   └─ Student can access fileUrl (Cloudinary CDN)
   └─ Click fileUrl → Download PDF directly from Cloudinary
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY STACK                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: JWT Authentication
────────────────────────────
├─ Verify token signature
├─ Check token expiration
├─ Decode user info (id, role, collegeId)
└─ Reject if invalid → 401 Unauthorized

Layer 2: Role-Based Access Control (RBAC)
──────────────────────────────────────────
├─ Upload endpoint: [SUPER_ADMIN, COLLEGE_ADMIN]
├─ Filter endpoint: [STUDENT, ADMIN]
├─ Check req.user.role
└─ Reject if unauthorized → 403 Forbidden

Layer 3: College-Based Data Isolation
──────────────────────────────────────
├─ Students: Auto-scope to req.user.collegeId
├─ COLLEGE_ADMIN: Auto-scope to their college
├─ SUPER_ADMIN: Can access any college
└─ Prevent cross-college data access

Layer 4: File Validation
─────────────────────────
├─ Check MIME type (PDF, DOC, DOCX, PPT, PPTX)
├─ Check file size (max 10MB)
├─ Validate file structure
└─ Reject malicious files → 400 Bad Request

Layer 5: Input Validation
──────────────────────────
├─ Validate college exists
├─ Validate module belongs to college
├─ Sanitize user inputs
└─ Use Prisma's parameterized queries

Layer 6: Environment Security
──────────────────────────────
├─ Cloudinary secrets in .env
├─ No hardcoded credentials
├─ Secure HTTPS for Cloudinary
└─ Production-ready configuration
```

---

## 📊 Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                        │
└─────────────────────────────────────────────────────────────────┘

        ┌─────────────┐
        │   College   │
        │─────────────│
        │ id (PK)     │
        │ name        │
        │ code        │
        └──────┬──────┘
               │
               │ 1:N
               │
        ┌──────▼──────┐
        │   Resource  │◄────────┐
        │─────────────│         │
        │ id (PK)     │         │
        │ title       │         │
        │ description │         │
        │ fileUrl     │         │ N:1
        │ fileType    │         │
        │ year        │◄─────┐  │
        │ facultyId   │      │  │
        │ moduleId (FK)───┐  │  │
        │ collegeId (FK)  │  │  │
        │ uploadedBy (FK)─┼──┼──┘
        └─────────────┘   │  │
                          │  │
                    ┌─────▼──┴────┐
                    │    Module   │
                    │─────────────│
                    │ id (PK)     │
                    │ name        │
                    │ code        │
                    │ collegeId   │
                    └─────────────┘
```

---

## 🎯 Role Permissions Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE PERMISSIONS                              │
└─────────────────────────────────────────────────────────────────┘

Action              │ SUPER_ADMIN │ COLLEGE_ADMIN │ STUDENT
────────────────────┼─────────────┼───────────────┼─────────
Upload Resource     │     ✅      │      ✅       │   ❌
  (with PDF)        │  (any coll) │  (own coll)   │   ❌
────────────────────┼─────────────┼───────────────┼─────────
Filter Resources    │     ✅      │      ✅       │   ✅
                    │  (any coll) │  (any coll)   │ (own coll)
────────────────────┼─────────────┼───────────────┼─────────
View Resources      │     ✅      │      ✅       │   ✅
                    │  (any coll) │  (own coll)   │ (own coll)
────────────────────┼─────────────┼───────────────┼─────────
Update Resource     │     ✅      │      ✅       │   ❌
                    │  (any coll) │  (own coll)   │   ❌
────────────────────┼─────────────┼───────────────┼─────────
Delete Resource     │     ✅      │      ✅       │   ❌
                    │  (any coll) │  (own coll)   │   ❌
────────────────────┼─────────────┼───────────────┼─────────
Download PDF        │     ✅      │      ✅       │   ✅
  (via fileUrl)     │             │               │
────────────────────┴─────────────┴───────────────┴─────────
```

---

## 📦 File Upload Process

```
┌─────────────────────────────────────────────────────────────────┐
│                  FILE UPLOAD LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: Client uploads PDF
   └─ FormData: { file: document.pdf, title: "Notes", ... }

Step 2: Multer receives file
   ├─ Validate: MIME type, size
   ├─ Generate: unique filename (resource-<timestamp>.pdf)
   └─ Save: /backend/uploads/resource-1234567890.pdf

Step 3: Controller receives req.file
   └─ req.file = { path, filename, mimetype, size, ... }

Step 4: Upload to Cloudinary
   ├─ Read: /backend/uploads/resource-1234567890.pdf
   ├─ Upload: to learnbox/colleges/1/resources/
   ├─ Receive: { secure_url, public_id, format, bytes }
   └─ Delete: local file (/backend/uploads/...)

Step 5: Save metadata to PostgreSQL
   ├─ Store: title, description, year, moduleId, etc.
   ├─ Store: fileUrl (Cloudinary CDN URL)
   └─ Store: uploadedBy, collegeId

Step 6: Return response
   └─ { success: true, data: { id, fileUrl, ... } }

Step 7: Student downloads
   └─ Click fileUrl → Direct download from Cloudinary CDN
```

---

## 🔄 Request/Response Examples

### Upload Resource (Admin)
```http
POST /api/resources/upload
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

─────────WebKitFormBoundary─────────
Content-Disposition: form-data; name="file"; filename="notes.pdf"
Content-Type: application/pdf

[PDF binary data]
─────────WebKitFormBoundary─────────
Content-Disposition: form-data; name="title"

Data Structures Notes
─────────WebKitFormBoundary─────────

Response (201):
{
  "success": true,
  "message": "Resource uploaded successfully",
  "data": {
    "id": 1,
    "title": "Data Structures Notes",
    "fileUrl": "https://res.cloudinary.com/demo/learnbox/notes.pdf",
    "year": 2,
    "moduleId": 5
  }
}
```

### Filter Resources (Student)
```http
GET /api/resources/filter?year=2&moduleId=5
Authorization: Bearer eyJhbGc...

Response (200):
{
  "success": true,
  "count": 3,
  "filters": {
    "collegeId": 1,
    "year": 2,
    "moduleId": 5
  },
  "data": [
    {
      "id": 1,
      "title": "Data Structures Notes",
      "fileUrl": "https://res.cloudinary.com/.../notes.pdf",
      "module": { "name": "Data Structures" }
    }
  ]
}
```

---

## 🎯 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

Upload Errors:
──────────────
No file           → 400 "No file uploaded"
Missing title     → 400 "Title is required"
Invalid file type → 400 "Invalid file type. Only PDF..."
File too large    → 400 "File too large. Max 10MB"
College not found → 404 "College not found"
Module mismatch   → 400 "Module does not belong to college"
Cloudinary fail   → 500 "Failed to upload to cloud"
Database error    → 500 "Database error occurred"

Filter Errors:
──────────────
No college        → 400 "Student must be associated with college"
Database error    → 500 "Database error occurred"

Auth Errors:
────────────
No token          → 401 "Unauthorized"
Invalid token     → 401 "Invalid token"
Wrong role        → 403 "Forbidden - insufficient permissions"
```

---

**This visual guide complements the detailed documentation.**
**Refer to RESOURCE-MANAGEMENT-GUIDE.md for full API documentation.**
