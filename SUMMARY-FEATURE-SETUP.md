# 📄 Document Summary Feature Setup Guide

## Overview
This feature allows students to upload PDF documents and get AI-powered summaries using a **local LLM (Ollama with gemma3:1b)**.

---

## 🚀 Setup Instructions

### 1. Install Ollama (If not already installed)

**Windows:**
```bash
# Download from: https://ollama.ai/download
# Or use winget:
winget install Ollama.Ollama
```

**Verify Installation:**
```bash
ollama --version
```

### 2. Pull the Gemma 3:1B Model

```bash
ollama pull gemma3:1b
```

**Note:** First download may take 5-10 minutes depending on your internet speed.

### 3. Start Ollama Server

```bash
ollama serve
```

The server will start on `http://localhost:11434` (default port).

**Verify it's running:**
```bash
# Test the API
curl http://localhost:11434/api/tags
```

### 4. Update Backend Environment Variables

Add to `backend/.env`:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b
```

### 5. Update Database Schema

```bash
cd backend
npx prisma db push
```

This will create the new tables:
- `document_summaries`
- `summary_questions`

### 6. Install Dependencies (if needed)

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 7. Start the Application

**Terminal 1 - Ollama Server (already running):**
```bash
ollama serve
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## ✅ Testing the Feature

### 1. Health Check
First, verify the LLM is accessible:

```bash
curl http://localhost:5000/api/summary/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "models": ["gemma3:1b"],
    "activeModel": "gemma3:1b"
  }
}
```

### 2. Test Upload via Frontend

1. Login as a **student**
2. Click **"Summaries"** in the sidebar
3. Upload a PDF file (max 10MB)
4. Wait for processing (30-60 seconds)
5. View the generated summary and key concepts

### 3. Test Upload via API (Optional)

```bash
curl -X POST http://localhost:5000/api/summary/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

---

## 📁 Files Created/Modified

### Backend Files:
- ✅ `backend/src/services/summary.service.js` - Ollama integration
- ✅ `backend/src/controllers/summary.controller.js` - API endpoints
- ✅ `backend/src/routes/summary.routes.js` - Route definitions
- ✅ `backend/src/app.js` - Added summary routes
- ✅ `backend/prisma/schema.prisma` - Added DocumentSummary & SummaryQuestion models

### Frontend Files:
- ✅ `frontend/src/app/pages/Summaries.tsx` - Chat interface page
- ✅ `frontend/src/services/api.ts` - Added summaryAPI endpoints
- ✅ `frontend/src/app/App.tsx` - Added /student/summaries route
- ✅ `frontend/src/app/pages/StudentDashboard.tsx` - Updated sidebar navigation

---

## 🎯 Features Implemented

### Core Features:
1. ✅ **PDF Upload** - Drag-and-drop or click to upload
2. ✅ **Quick Summary** - 3-4 sentence TL;DR
3. ✅ **Key Concepts Extraction** - Important terms with definitions
4. ✅ **Summary History** - Access previously processed documents
5. ✅ **Chat Interface** - Conversational UI for better UX
6. ✅ **Delete Summaries** - Remove old summaries

### Advanced Features (Available via API):
7. ✅ **Detailed Summary** - GET `/api/summary/:id/detailed`
8. ✅ **Study Notes** - GET `/api/summary/:id/notes`
9. ✅ **Q&A** - POST `/api/summary/:id/question`

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to local LLM"

**Solution 1:** Check if Ollama is running
```bash
ollama list
```

**Solution 2:** Restart Ollama
```bash
# Stop existing Ollama process
taskkill /F /IM ollama.exe

# Start again
ollama serve
```

### Issue: "Model 'gemma3:1b' not found"

**Solution:** Pull the model
```bash
ollama pull gemma3:1b
```

**List available models:**
```bash
ollama list
```

### Issue: PDF text extraction fails

**Possible causes:**
- PDF is image-based (scanned document)
- PDF is corrupted
- File size too large

**Solution:** Try with a different PDF or use text-based PDFs.

### Issue: Processing takes too long

**Tips:**
- Gemma3:1b is optimized for speed
- First request may be slower (model loading)
- Subsequent requests should be faster (30-60s)
- Consider reducing text sent to LLM (currently limited to 8000-12000 chars)

---

## 📊 API Endpoints

### Summary Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/summary/health` | Check LLM health | No |
| POST | `/api/summary/upload` | Upload & summarize PDF | Yes |
| GET | `/api/summary/history` | Get user's summaries | Yes |
| GET | `/api/summary/:id` | Get single summary | Yes |
| GET | `/api/summary/:id/detailed` | Get detailed summary | Yes |
| GET | `/api/summary/:id/notes` | Get study notes | Yes |
| POST | `/api/summary/:id/question` | Ask question | Yes |
| DELETE | `/api/summary/:id` | Delete summary | Yes |

---

## 🎨 UI Screenshots

### Chat Interface:
- Clean, modern chat-style interface
- Upload button with file type validation
- Loading states with spinner
- Message bubbles (user vs assistant)
- History sidebar with quick access

### Features visible in UI:
- ✅ File upload with drag-and-drop support
- ✅ Real-time processing feedback
- ✅ Summary display with formatting
- ✅ Key concepts list
- ✅ Processing time indicator
- ✅ History panel with delete option

---

## 🚨 Important Notes

1. **Local LLM Required:** Ollama must be running on `http://localhost:11434`
2. **Student-Only:** Only students can access this feature
3. **PDF Only:** Currently supports PDF files only (max 10MB)
4. **Processing Time:** Expect 30-60 seconds per document
5. **Caching:** Detailed summaries and study notes are cached to avoid reprocessing

---

## 🔄 Next Steps (Optional Enhancements)

If you want to extend this feature:

1. **Add Export Functionality:**
   - Export summaries as PDF/Markdown
   - Download study notes

2. **Add Flashcard Generation:**
   - Auto-generate term/definition pairs
   - Practice mode

3. **Implement Q&A in Frontend:**
   - Add question input in chat
   - Show previous Q&A history

4. **Support More File Types:**
   - DOCX, PPTX, TXT
   - Update upload middleware

5. **Add Streaming Responses:**
   - Use Ollama's streaming API
   - Show text as it's generated

---

## 📞 Support

If you encounter any issues:
1. Check Ollama is running: `ollama list`
2. Check backend logs for errors
3. Verify database migrations: `npx prisma studio`
4. Test health endpoint: `curl http://localhost:5000/api/summary/health`

---

**🎉 Setup Complete! Your document summary feature is ready to use.**
