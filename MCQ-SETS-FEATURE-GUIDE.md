# MCQ Sets Management Feature

## Overview
Implemented a complete MCQ Sets management system that allows college admins to upload and manage MCQ sets, which students can then practice on their dashboard with automatic scoring and recommendations.

## Features Implemented

### 1. Admin MCQ Sets Page (`AdminMCQSetsPage.tsx`)
**Location:** `/admin/mcq-sets`

#### Features:
- **View All MCQ Sets:** Display all uploaded MCQ sets with pagination
- **Filter & Search:**
  - Search by set title or description
  - Filter by faculty
  - Filter by module
- **Create MCQ Sets (2 Methods):**
  - **Upload PDF/Word document** - AI extracts questions automatically
  - **Manually add MCQs** one by one
  - Set title, description, and module association
- **View Set Details:** Preview all questions in a set with correct answers highlighted
- **Delete Sets:** Remove MCQ sets (with confirmation)
- **Statistics Dashboard:**
  - Total sets count
  - Total questions across all sets
  - Filtered results count

#### Document Upload (PDF/Word):
Upload a document containing pre-written MCQs and AI will automatically extract:
- Question text
- All 4 options (A, B, C, D)
- Correct answer
- Explanations (if provided)
- Difficulty level (auto-estimated)
- Topics (auto-inferred)

**Document Formatting Tips:**
```
1. What is the time complexity of binary search?
   A) O(n)
   B) O(log n)
   C) O(n^2)
   D) O(1)
   Answer: B
   Explanation: Binary search divides the search space in half each iteration

2. Which data structure uses LIFO principle?
   a. Queue
   b. Stack
   c. Tree
   d. Graph
   Correct: Stack
```

**Supported Formats:** .pdf, .doc, .docx (max 10MB)

### 2. Updated Admin Dashboard
**Location:** `/admin/dashboard`

#### Changes:
- Added "MCQ Sets" menu item with Brain icon
- Integrated new route for `/admin/mcq-sets`
- Updated navigation to include MCQ management

### 3. Backend API Enhancements

#### New Endpoint:
**DELETE `/api/mcqs/sets/:id`**
- Deletes an MCQ set and all associated questions
- College-scoped (admins can only delete sets from their college)
- Cascade deletes SetMCQ junction table entries
- Requires `COLLEGE_ADMIN` role

#### Updated Exports:
- Added `deleteMCQSet` controller function
- Updated route imports and exports

### 4. Frontend API Service
**Location:** `frontend/src/services/api.ts`

#### New Method:
```typescript
mcqAPI.deleteSet(id: number)
```

## How It Works

### For College Admins:

1. **Navigate to MCQ Sets Page:**
   - Click "MCQ Sets" in the admin sidebar
   - View all existing MCQ sets with statistics

2. **Create a New MCQ Set:**
   - Click "Create Set" button
   - Fill in set information (title, description)
   - Select cascade dropdowns: Faculty → Year → Module
   - Choose upload method:
     - **PDF/Word Upload:** Let AI extract MCQs from your document
     - **Manual Entry:** Add questions one by one using the form

3. **Manual Entry Process:**
   - Enter question text
   - Fill in 4 options (A, B, C, D)
   - Select correct answer from dropdown
   - Choose difficulty level (Easy/Medium/Hard)
   - Add optional topic tag
   - Add optional explanation
   - Click "Add Question to Set" to add to current set
   - Repeat for more questions
   - Click "Create MCQ Set" when done

4. **Manage Existing Sets:**
   - **View:** Click "View" to see all questions with answers
   - **Delete:** Click "Delete" to remove set (with confirmation)
   - **Filter:** Use faculty/module filters to find specific sets
   - **Search:** Search by title or description

### For Students:

1. **Access MCQ Practice:**
   - Navigate to `/student/practice-selection`
   - Select faculty, year, and module from filters
   - See uploaded MCQ sets for selected module

2. **Practice MCQ Sets:**
   - Click on any available MCQ set
   - Answer all questions in the set
   - Submit to see:
     - Overall score and percentage
     - Correct answers for wrong questions
     - Explanations (if provided)
     - Performance analytics
     - Recommendations for improvement

3. **Scoring System:**
   - Automatic calculation of score
   - Detailed breakdown by topic/difficulty
   - Weak area identification
   - Personalized study recommendations

## Database Schema

### Existing MCQSet Model:
```prisma
model MCQSet {
  id          Int          @id @default(autoincrement())
  title       String
  description String?
  moduleId    Int?
  collegeId   Int
  createdBy   Int
  source      MCQSource    @default(MANUAL)
  sourceFile  String?
  isPublic    Boolean      @default(true)
  college     College      @relation(...)
  creator     User         @relation(...)
  module      Module?      @relation(...)
  mcqs        SetMCQ[]
  sessions    QuizSession[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### SetMCQ Junction Table:
```prisma
model SetMCQ {
  id        Int     @id @default(autoincrement())
  setId     Int
  mcqId     Int
  order     Int     @default(0)
  set       MCQSet  @relation(..., onDelete: Cascade)
  mcq       MCQ     @relation(..., onDelete: Cascade)
}
```

## API Endpoints Summary

### Admin Endpoints:
- `POST /api/mcqs/bulk` - Bulk upload MCQs with optional set creation
- `POST /api/mcqs/parse-document` - Parse MCQs from PDF/Word document (new)
- `DELETE /api/mcqs/sets/:id` - Delete MCQ set

### Student/Both Endpoints:
- `GET /api/mcqs/sets` - Get all MCQ sets (filtered by college/module)
- `GET /api/mcqs/sets/:id` - Get set details with all questions

## UI Components Used

### Shadcn/UI Components:
- `Card` - Container for stats and tables
- `Dialog` - Modal dialogs for upload and viewing
- `Button` - Action buttons
- `Badge` - Status and category indicators
- Various form inputs

### Icons from Lucide React:
- `Brain` - MCQ Sets menu icon
- `Plus` - Add/Create actions
- `FileJson` - JSON upload
- `Upload` - File upload
- `Eye` - View details
- `Trash2` - Delete action
- `Search` - Search functionality
- `ChevronLeft/Right` - Pagination

## Testing Checklist

### Admin Functions:
- [ ] Navigate to `/admin/mcq-sets`
- [ ] Create set with PDF document upload
- [ ] Create set with Word document upload
- [ ] Create set with manual entry
- [ ] Add multiple questions to a set
- [ ] View set details
- [ ] Delete a set
- [ ] Filter by faculty
- [ ] Filter by module
- [ ] Search by title
- [ ] Check pagination

### Student Functions:
- [ ] Navigate to MCQ practice page
- [ ] Select module with uploaded sets
- [ ] See uploaded MCQ sets displayed
- [ ] Start practice with a set
- [ ] Submit answers
- [ ] View score and feedback
- [ ] Check recommendations

### Edge Cases:
- [ ] Upload invalid document format
- [ ] Try to create set without module
- [ ] Delete set with active quiz sessions
- [ ] View empty state (no sets)
- [ ] Large sets (50+ questions)
- [ ] Document with no recognizable MCQ format

## Example Document File

Create a Word/PDF document like this:

```
Data Structures Quiz - Module: Computer Science

1. What is the time complexity of binary search?
   A) O(n)
   B) O(log n)
   C) O(n^2)
   D) O(1)
   
   Answer: B
   Explanation: Binary search divides the search space in half each iteration.
   Difficulty: Medium

2. Which data structure uses LIFO principle?
   A) Queue
   B) Stack
   C) Tree
   D) Graph
   
   Correct Answer: Stack
   Explanation: Stack follows the Last In First Out (LIFO) principle.

3. What is the space complexity of merge sort?
   a. O(1)
   b. O(log n)
   c. O(n)
   d. O(n log n)
   
   Answer: c
   Note: Merge sort requires additional space proportional to the input size.
```

The AI will automatically parse this format and extract:
- Questions
- Options (handles A/B/C/D, a/b/c/d, or numbered formats)
- Correct answers (handles "Answer:", "Correct:", "Correct Answer:", etc.)
- Explanations (optional)
- Difficulty levels (auto-estimated if not provided)

## Next Steps

1. **Start the servers:**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

2. **Access admin dashboard:**
   - Navigate to `http://localhost:5173/admin/dashboard`
   - Click "MCQ Sets" in sidebar
   - Create your first MCQ set

3. **Test student view:**
   - Login as a student
   - Go to MCQ practice
   - Select module with uploaded sets
   - Practice and verify scoring works

## Benefits

✅ **For Admins:**
- AI-powered extraction from PDF/Word documents
- Manual entry for custom questions
- Complete CRUD operations
- Module-based organization with cascade selection (Faculty → Year → Module)
- Performance tracking

✅ **For Students:**
- Structured practice sets
- Immediate feedback
- Detailed explanations
- Progress tracking
- Personalized recommendations

✅ **For System:**
- Reuses existing quiz infrastructure
- Consistent with generated MCQs
- College-scoped data isolation
- Efficient database queries
- Clean separation of concerns
- AI-powered document parsing using active LLM configuration
