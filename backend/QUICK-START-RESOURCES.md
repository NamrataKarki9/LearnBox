# 🚀 Quick Start Guide - Resource Management

## Prerequisites
- ✅ Node.js installed
- ✅ PostgreSQL running
- ✅ Backend server configured
- ✅ Valid JWT authentication

---

## 📦 Installation (Already Completed)

The following packages have been installed:
```bash
npm install cloudinary multer
```

---

## ⚙️ Configuration Steps

### Step 1: Set Up Cloudinary

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com/
   - Sign up for a free account
   - Verify your email

2. **Get API Credentials**
   - Login to Cloudinary Dashboard
   - Navigate to: Dashboard → Settings → Access Keys
   - Copy the following:
     - Cloud Name
     - API Key
     - API Secret

3. **Update `.env` File**
   ```env
   # Replace with your actual Cloudinary credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

### Step 2: Apply Database Changes

```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## 🧪 Testing the API

### Test 1: Upload Resource (Admin)

**Using Postman:**
1. Create new POST request
2. URL: `http://localhost:5000/api/resources/upload`
3. Headers:
   ```
   Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
   ```
4. Body → form-data:
   ```
   file: [Select a PDF file]
   title: "Test Resource"
   description: "This is a test"
   year: 2
   moduleId: 1
   ```
5. Click Send

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Resource uploaded successfully",
  "data": {
    "id": 1,
    "title": "Test Resource",
    "fileUrl": "https://res.cloudinary.com/...",
    ...
  }
}
```

### Test 2: Filter Resources (Student)

**Using Postman:**
1. Create new GET request
2. URL: `http://localhost:5000/api/resources/filter?year=2`
3. Headers:
   ```
   Authorization: Bearer YOUR_STUDENT_JWT_TOKEN
   ```
4. Click Send

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "filters": {
    "collegeId": 1,
    "year": 2
  },
  "data": [...]
}
```

---

## 🎯 API Endpoints Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/resources/upload` | POST | ADMIN | Upload PDF with file |
| `/api/resources/filter` | GET | STUDENT | Filter resources |
| `/api/resources` | GET | ALL | Get all resources |
| `/api/resources/:id` | PUT | ADMIN | Update resource |
| `/api/resources/:id` | DELETE | ADMIN | Delete resource |

---

## 🔒 Required Roles

### SUPER_ADMIN & COLLEGE_ADMIN Can:
- ✅ Upload resources with PDF files
- ✅ Edit resources
- ✅ Delete resources
- ✅ View all resources

### STUDENT Can:
- ✅ Filter resources by college/year/module
- ✅ View resource details
- ✅ Download PDF files
- ❌ CANNOT upload/edit/delete

---

## 📝 File Upload Rules

| Rule | Value |
|------|-------|
| Allowed Types | PDF, DOC, DOCX, PPT, PPTX |
| Max File Size | 10 MB |
| Upload Field Name | `file` |
| Storage Location | Cloudinary Cloud |

---

## ⚠️ Common Issues

### Issue: "No file uploaded"
- ✅ Ensure you're using `form-data` not JSON
- ✅ Field name must be `file`
- ✅ File must be selected

### Issue: "Invalid file type"
- ✅ Only PDF, DOC, DOCX, PPT, PPTX allowed
- ✅ Check file extension

### Issue: "File too large"
- ✅ Max size is 10MB
- ✅ Compress your PDF

### Issue: "Cloudinary upload failed"
- ✅ Check `.env` credentials
- ✅ Verify Cloudinary account is active
- ✅ Check internet connection

---

## 📂 New Files Created

```
backend/
├── src/
│   ├── config/
│   │   └── cloudinary.config.js       ← NEW
│   ├── middleware/
│   │   └── upload.middleware.js       ← NEW
│   ├── controllers/
│   │   └── resource.controller.js     ← UPDATED
│   └── routes/
│       └── resource.routes.js         ← UPDATED
├── prisma/
│   └── schema.prisma                  ← UPDATED
└── RESOURCE-MANAGEMENT-GUIDE.md       ← NEW
```

---

## 🎉 You're Ready!

1. ✅ Cloudinary configured
2. ✅ Database schema updated
3. ✅ API endpoints ready
4. ✅ File upload working
5. ✅ Role-based access enforced

**Start your server and test the endpoints!**

```bash
npm run dev
```

---

**Need Help?** Check `RESOURCE-MANAGEMENT-GUIDE.md` for detailed documentation.
