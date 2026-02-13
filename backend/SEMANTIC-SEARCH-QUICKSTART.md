# 🚀 Quick Start: Semantic Search

## For Developers

### 1. First Time Setup

```bash
# Navigate to backend
cd backend

# Vectorize all existing PDFs (this will take a few minutes)
node vectorize-resources.js
```

**Wait for completion** - You'll see a summary like:
```
✅ Successful: 10
⚠️  Skipped: 0
❌ Failed: 0
✨ Vectorization process completed!
```

### 2. Start the Server

```bash
# If not already running
npm run dev
```

### 3. Test the Search

Open the frontend and:
1. Login as a student
2. Go to Dashboard
3. Type a query like: "explain algorithms"
4. Press Enter or click Search

## For Students

### How to Use Semantic Search

1. **Go to your Dashboard**
   
2. **Type a natural language question** in the search bar at the top
   - Good queries:
     - "explain neural networks"
     - "introduction to databases"
     - "sorting algorithms"
     - "calculus derivatives"
   
3. **Press Enter** or click the "Search" button

4. **Review results** with:
   - Relevance score (% match)
   - Matched text excerpts
   - Faculty/Year/Module tags

5. **Click "View Resource"** to open the PDF

### Tips for Better Results

- ✅ Use descriptive terms: "explain recursion in programming"
- ✅ Ask questions: "what is polymorphism?"
- ✅ Use technical terms: "neural network backpropagation"
- ❌ Avoid very short queries: "AI" (too broad)
- ❌ Avoid searching by file name (use metadata filters instead)

### Using Filters

Combine search with filters for better results:
1. Select Faculty (e.g., Computer Science)
2. Select Year (e.g., Year 2)
3. Select Module (e.g., Data Structures)
4. Then search: "binary tree traversal"

## Maintenance

### When to Re-Vectorize

Run the vectorization script again when:
- ✅ New PDFs are uploaded
- ✅ PDFs are updated/replaced
- ✅ Weekly maintenance (recommended)

```bash
cd backend
node vectorize-resources.js
```

### Monitoring

Check if the search index is ready:

**Via API**:
```bash
curl http://localhost:5000/api/search/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
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

## Common Issues

### "Search system is being initialized"

**Cause**: Vector database not set up yet

**Fix**: Run vectorization script
```bash
cd backend
node vectorize-resources.js
```

### No results found

**Possible causes**:
1. Filters too restrictive → Try "All Faculties/Years"
2. Query too specific → Try broader terms
3. No related content → Try different keywords

### Slow search

**Normal**: First search after server restart takes 5-10 seconds (model loading)

**Persistent slowness**: 
- Check server resources (CPU/RAM)
- Consider running vectorization during off-hours

## Architecture Overview

```
┌─────────────────┐
│  Student Types  │
│     Query       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │
│  (Dashboard)    │
└────────┬────────┘
         │ POST /api/search/semantic
         ▼
┌─────────────────┐
│   Backend       │
│  Search API     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate       │
│  Embedding      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ChromaDB      │
│  Vector Search  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Return Top    │
│   Matching PDFs │
└─────────────────┘
```

## Performance

- **Vectorization**: ~5 seconds per PDF (10 pages)
- **Search Query**: 100-300ms
- **First Load**: 5-10 seconds (model download/cache)
- **Model Size**: ~90MB (downloads once, cached locally)

## Need Help?

Check the detailed guide:
- **Full Documentation**: `SEMANTIC-SEARCH-GUIDE.md`
- **API Reference**: See "API Usage" section in guide
- **Troubleshooting**: See "Troubleshooting" section in guide

---

**Quick Commands**:

```bash
# Vectorize PDFs
node vectorize-resources.js

# Start backend
npm run dev

# Check status (from another terminal)
curl http://localhost:5000/api/search/status -H "Authorization: Bearer TOKEN"
```
