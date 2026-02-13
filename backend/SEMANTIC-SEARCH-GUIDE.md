# 🔍 Semantic Search Implementation Guide

## Overview

This feature enables AI-powered semantic search across all PDF resources in the LearnBox platform. Students can search using natural language queries like "explain neural networks" or "introduction to databases", and the system will find the most relevant PDFs based on their content, not just title/description.

## 🎯 Features

- **AI-Powered Search**: Uses embedding models to understand query intent
- **Content-Based Matching**: Searches through actual PDF content, not just metadata
- **Local Processing**: Runs entirely on your server (no external API keys needed)
- **Filter Integration**: Works with existing faculty/year/module filters
- **Relevance Scoring**: Shows match percentage for each result
- **Matched Excerpts**: Displays relevant text snippets from PDFs

## 🏗️ Architecture

### Components

1. **Embedding Model** (`@xenova/transformers`)
   - Uses `all-MiniLM-L6-v2` model
   - Runs locally without API keys
   - Converts text to 384-dimensional vectors

2. **Vector Database** (ChromaDB)
   - Stores PDF content embeddings
   - Enables fast similarity search
   - Stored locally in `backend/chroma_db/`

3. **PDF Processing** (`pdf-parse`)
   - Extracts text from PDF files
   - Splits into chunks for better matching
   - Handles Cloudinary-hosted files

### How It Works

```
┌──────────────┐
│ Student Types│
│ Search Query │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ Generate Query Embedding         │
│ (Convert text to vector)         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ ChromaDB Vector Search           │
│ (Find similar content chunks)    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Aggregate & Rank Results         │
│ (Group by resource, score)       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return Top Matching PDFs         │
│ (With relevance scores & excerpts)│
└──────────────────────────────────┘
```

## 📦 Installation

### 1. Install Dependencies

Already done! The following packages were installed:

```bash
cd backend
npm install chromadb pdf-parse @xenova/transformers
```

### 2. Project Structure

New files added:
```
backend/
├── vectorize-resources.js          # Script to index PDFs
├── src/
│   ├── config/
│   │   └── chroma.config.js        # ChromaDB configuration
│   ├── services/
│   │   ├── embedding.service.js    # Embedding generation
│   │   ├── pdf.service.js          # PDF text extraction
│   │   └── search.service.js       # Semantic search logic
│   ├── controllers/
│   │   └── search.controller.js    # Search API handlers
│   └── routes/
│       └── search.routes.js        # Search endpoints
└── chroma_db/                      # Vector database storage (auto-created)
```

## 🚀 Setup & Usage

### Step 1: Vectorize Existing Resources

Before using semantic search, you need to process all existing PDFs:

```bash
cd backend
node vectorize-resources.js
```

**What this does:**
1. Fetches all resources from the database
2. Downloads each PDF from Cloudinary
3. Extracts text content
4. Splits text into chunks (1000 chars each, 200 char overlap)
5. Generates embeddings for each chunk
6. Stores embeddings in ChromaDB

**Expected output:**
```
🚀 Starting Resource Vectorization Process
================================================================================

📦 Creating new collection: resource_embeddings
📂 Fetching resources from database...
📊 Found 10 resources to process

[1/10]
================================================================================
📚 Processing: Introduction to AI (ID: 1)
   URL: https://res.cloudinary.com/...
📄 Downloading PDF from: https://...
🔍 Extracting text from PDF...
✅ Extracted 15234 characters from PDF
📊 Split into 16 chunks
🔮 Generating embeddings...
   Processed 10/16 chunks
💾 Storing 16 embeddings in ChromaDB...
✅ Successfully processed resource 1

...

================================================================================

📊 VECTORIZATION SUMMARY

Total Resources: 10
✅ Successful: 10
⚠️  Skipped: 0
❌ Failed: 0

================================================================================

✨ Vectorization process completed!
```

**First Run Note**: The first time you run this, it will download the embedding model (~90MB). This happens once and is cached locally.

### Step 2: Re-vectorize When Adding New Resources

Run the script again whenever you upload new PDFs:

```bash
node vectorize-resources.js
```

The script will process all resources, but ChromaDB will skip duplicates automatically.

**Optional**: Add to your workflow as a scheduled task:
```bash
# Linux/Mac crontab (runs every night at 2 AM)
0 2 * * * cd /path/to/backend && node vectorize-resources.js >> logs/vectorize.log 2>&1
```

### Step 3: Use Semantic Search

The search is now available in the Student Dashboard!

**Frontend Usage:**
1. Go to Student Dashboard
2. Type a natural language query in the search bar
3. Press Enter or click "Search"
4. View results with relevance scores and excerpts

**Example Queries:**
- "explain neural networks"
- "introduction to database systems"
- "sorting algorithms"
- "object oriented programming concepts"
- "calculus derivatives"

**API Usage:**

```javascript
POST /api/search/semantic
Authorization: Bearer <token>

{
  "query": "explain neural networks",
  "facultyId": "1",        // optional
  "year": "2",             // optional
  "moduleId": "5",         // optional
  "limit": 10              // optional, default: 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "title": "Deep Learning Basics",
      "description": "Introduction to neural networks",
      "fileUrl": "https://...",
      "fileType": "pdf",
      "year": 2,
      "facultyId": 1,
      "moduleId": 5,
      "relevanceScore": 0.87,
      "chunkCount": 12,
      "matchedChunks": [
        "Neural networks are computing systems inspired by biological neural networks..."
      ],
      "module": { "id": 5, "name": "AI Fundamentals", "code": "AI101" },
      "faculty": { "id": 1, "name": "Computer Science", "code": "CS" }
    }
  ],
  "count": 1,
  "query": "explain neural networks",
  "filters": { "facultyId": "1", "year": "2" }
}
```

## 🔧 Configuration

### Chunk Size Tuning

In `src/services/pdf.service.js`:

```javascript
export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  // Adjust these values:
  // - chunkSize: Larger = more context, but fewer chunks
  // - overlap: Prevents splitting related content
}
```

**Recommended values:**
- **Technical docs**: `chunkSize: 1500, overlap: 300`
- **General content**: `chunkSize: 1000, overlap: 200` (default)
- **Short resources**: `chunkSize: 500, overlap: 100`

### Search Result Limit

In `src/services/search.service.js`:

```javascript
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: limit * 3, // Increase multiplier for more results
  where: whereFilter
});
```

## 📊 Monitoring

### Check Vector DB Status

```bash
# Via API
GET /api/search/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "count": 156,
    "message": "Vector database ready with 156 embedded chunks"
  }
}
```

### Database Location

- **Path**: `backend/chroma_db/`
- **Size**: ~10MB per 100 PDFs (varies by content)
- **Backup**: Copy the entire `chroma_db/` folder

## ⚡ Performance

### Benchmarks (Typical Server)

| Operation | Time |
|-----------|------|
| First model load | 5-10 seconds |
| Subsequent loads | Instant (cached) |
| Vectorize 1 PDF (10 pages) | 3-5 seconds |
| Vectorize 1 PDF (100 pages) | 15-25 seconds |
| Search query | 100-300ms |
| Concurrent searches (10) | 500-800ms |

### Optimization Tips

1. **Run vectorization during off-hours**
   - Processing is CPU-intensive
   - Use scheduled tasks

2. **Increase worker threads for embedding**
   ```javascript
   // In embedding.service.js
   const pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
     quantized: true, // Use quantized model for faster inference
   });
   ```

3. **Cache frequently searched queries**
   - Redis cache layer
   - TTL: 1 hour

## 🐛 Troubleshooting

### Issue: "Collection does not exist"

**Solution**: Run vectorization script
```bash
node vectorize-resources.js
```

### Issue: Model download fails

**Solution**: Check internet connection and firewall
```bash
# The model downloads from HuggingFace
# URL: https://huggingface.co/Xenova/all-MiniLM-L6-v2
```

### Issue: PDF extraction fails

**Causes**:
- PDF is password protected
- PDF is corrupted
- URL is expired (Cloudinary)

**Solution**: Check logs in vectorization output

### Issue: Search returns no results

**Checks**:
1. Is vector DB populated? Check status endpoint
2. Are filters too restrictive? Try without filters
3. Is query too specific? Try broader terms

### Issue: High memory usage

**Solution**: Process in batches
```javascript
// In vectorize-resources.js
// Process 10 resources at a time
for (let i = 0; i < resources.length; i += 10) {
  const batch = resources.slice(i, i + 10);
  await Promise.all(batch.map(r => processResource(r, collection)));
}
```

## 🔒 Security Considerations

1. **Authentication**: All search endpoints require JWT authentication
2. **Access Control**: Students only see resources from their college (enforced by filters)
3. **Rate Limiting**: Consider adding rate limits to search endpoint
4. **Resource URLs**: Cloudinary URLs are signed/private

## 🚨 Important Notes

1. **First Run**: Model download (~90MB) happens automatically
2. **Storage**: ChromaDB requires ~10MB per 100 PDFs
3. **CPU Usage**: Vectorization is CPU-intensive (use off-peak hours)
4. **Updates**: Re-run vectorization after uploading new resources
5. **Filters**: Search respects existing faculty/year/module filters

## 📝 Future Enhancements

- [ ] Automatic vectorization on resource upload
- [ ] Incremental updates (only new resources)
- [ ] Multi-language support
- [ ] Query suggestions / autocomplete
- [ ] Search analytics dashboard
- [ ] Advanced filters (date range, file type)
- [ ] Export search results

## 🤝 Support

For issues or questions:
1. Check logs: `backend/logs/` (if configured)
2. Review vectorization output
3. Test API directly with Postman
4. Check ChromaDB status endpoint

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Dependencies**: ChromaDB ^0.1.x, Xenova/transformers ^2.x, pdf-parse ^1.1.x
