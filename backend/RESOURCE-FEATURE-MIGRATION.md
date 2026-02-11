# Resource Management Feature - Migration Guide

## Changes Made

### 1. Database Schema Changes
Added Faculty model and made fields mandatory in Resource model:

**New Faculty Model:**
- `id`: Primary key
- `name`: Faculty name (e.g., "Computer Science and Engineering")
- `code`: Faculty code (e.g., "CSE")
- `description`: Optional description
- `collegeId`: Foreign key to College
- Unique constraint on `(code, collegeId)`

**Updated Resource Model:**
- `year`: Now **mandatory** (was optional)
- `facultyId`: Now **mandatory** with relation to Faculty model (was just optional integer)
- `moduleId`: Now **mandatory** (was optional)
- Added `faculty` relation

### 2. Backend Changes

#### New Files Created:
- `src/controllers/faculty.controller.js` - Faculty CRUD operations
- `src/routes/faculty.routes.js` - Faculty API routes

#### Modified Files:
- `prisma/schema.prisma` - Added Faculty model, updated Resource model
- `src/controllers/resource.controller.js` - Added mandatory field validation, faculty checks, increased timeout
- `src/app.js` - Registered faculty routes

#### New API Endpoints:
- `GET /api/faculties` - Get all faculties (college-scoped)
- `POST /api/faculties` - Create new faculty (College Admin)
- `PUT /api/faculties/:id` - Update faculty (College Admin)
- `DELETE /api/faculties/:id` - Delete faculty (College Admin)

### 3. Frontend Changes

#### Modified Files:
- `src/services/api.ts`:
  - Increased upload timeout from 30s to 120s (2 minutes)
  - Added `facultyAPI` with `getAll()` method
  
- `src/app/components/UploadResourceDialog.tsx`:
  - Added Faculty dropdown (before Year dropdown)
  - Made Faculty, Year, and Module fields **mandatory**
  - Description remains optional
  - Added faculty state management
  - Updated form validation

### 4. Timeout Issue Fix

**Problem:** "timeout of 30000ms exceeded" error when uploading files

**Solutions Implemented:**
1. **Frontend:** Increased axios timeout from 30s to 120s (2 minutes)
2. **Backend:** Added timeout parameter support in Cloudinary upload options
3. **Controller:** Set 2-minute timeout for large file uploads

## Migration Steps

### Step 1: Update Database Schema

```bash
cd backend
npx prisma migrate dev --name add_faculty_and_mandatory_fields
```

This will:
- Create the Faculty table
- Update Resource table to make fields mandatory
- Generate migration files

### Step 2: Seed Faculty Data

```bash
node seed-faculties.js
```

This creates common faculties (CSE, IT, ECE, etc.) for all existing colleges.

### Step 3: Handle Existing Data

**⚠️ IMPORTANT:** Existing resources with NULL values will cause issues.

**Option A - If no existing resources:**
No action needed, proceed to step 4.

**Option B - If existing resources exist:**

You need to update existing resources to have valid faculty, year, and module IDs:

```sql
-- Check existing resources with NULL values
SELECT id, title, year, facultyId, moduleId FROM "Resource" 
WHERE year IS NULL OR facultyId IS NULL OR moduleId IS NULL;

-- Update resources (adjust IDs as needed)
UPDATE "Resource" 
SET 
  year = 1,  -- Set default year
  facultyId = (SELECT id FROM "Faculty" WHERE code = 'CSE' LIMIT 1),  -- Set default faculty
  moduleId = (SELECT id FROM "Module" LIMIT 1)  -- Set default module
WHERE year IS NULL OR facultyId IS NULL OR moduleId IS NULL;
```

### Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

### Step 5: Test the Feature

1. Login as College Admin
2. Click "Upload Resource" button
3. Verify new form has:
   - Title * (required)
   - Description (optional)
   - Faculty * (required dropdown)
   - Academic Year * (required dropdown)
   - Module * (required dropdown)
   - File * (required)
4. Try uploading a resource
5. Verify no timeout errors occur

## Rollback Plan

If you need to rollback:

```bash
cd backend
npx prisma migrate dev --name rollback_faculty_changes
```

Then manually revert the schema changes in `schema.prisma` and re-run migration.

## API Testing

### Create Faculty
```bash
curl -X POST http://localhost:5000/api/faculties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science and Engineering",
    "code": "CSE",
    "description": "Department of Computer Science"
  }'
```

### Get All Faculties
```bash
curl http://localhost:5000/api/faculties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Upload Resource with Faculty
```bash
curl -X POST http://localhost:5000/api/resources/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Resource" \
  -F "description=Test description" \
  -F "facultyId=1" \
  -F "year=2" \
  -F "moduleId=1"
```

## Validation Rules

All fields are now validated on both frontend and backend:

1. **Title:** Required, non-empty string
2. **Description:** Optional
3. **Faculty:** Required, must exist and belong to college
4. **Year:** Required, must be 1-4
5. **Module:** Required, must exist and belong to college
6. **File:** Required, max 10MB, allowed formats: PDF, DOC, DOCX, PPT, PPTX

## Troubleshooting

### "Faculty not found" error
- Run `node seed-faculties.js` to create default faculties
- Or create faculties manually via API/Admin panel

### "Module does not belong to the specified college" error
- Ensure the selected module belongs to the admin's college
- Check module data in database

### Timeout still occurring
- Check internet connection
- Verify Cloudinary credentials
- Check file size (must be < 10MB)
- Look at backend logs for detailed error

### Migration fails
- Backup database first
- Check for existing resources with NULL values
- Update existing resources before migration
- Check Prisma schema syntax

## Notes

- Faculty data is college-scoped (each college has its own faculties)
- Faculty codes must be unique within a college
- Cannot delete faculty if it has associated resources
- Upload timeout is now 2 minutes (120 seconds)
- All existing error handling and validation remains intact
