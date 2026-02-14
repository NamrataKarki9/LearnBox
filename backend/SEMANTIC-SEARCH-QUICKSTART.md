# 🚀 Quick Start: Semantic Search

## ✨ NEW: Auto-Vectorization Enabled!

**Good news**: Resources are now **automatically vectorized** when uploaded. You don't need to run the vectorization script manually anymore!

- ✅ Upload a PDF → Automatically searchable within seconds
- ✅ Update a resource → Automatically re-indexed
- ✅ Delete a resource → Automatically removed from search

## For Developers

### 1. First Time Setup (Existing Resources Only)

If you have **existing resources** in your database that were uploaded before auto-vectorization was implemented, run this once:

```bash
# Navigate to backend
cd backend

# Vectorize all existing PDFs (one-time only)
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

**That's it!** New uploads are automatically indexed.

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

### Automatic Vectorization

✅ **Automatic for new resources** - No action needed!

When you:
- **Upload** a resource → Automatically vectorized in the background
- **Update** a resource → Automatically re-vectorized
- **Delete** a resource → Automatically removed from index

### Manual Re-Vectorization (Optional)

Only needed if you want to rebuild the entire index:

```bash
cd backend
node vectorize-resources.js
```

Use cases for manual re-vectorization:
- Fixing corrupted index
- Upgrading embedding model
- Bulk re-processing after configuration changes

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
    "message": "Vector database r for existing resources (one-time)
```bash
cd backend
node vectorize-resources.js
```

### Newly uploaded resource not appearing in search

**Check**:
1. Wait a few seconds (vectorization happens in background)
2. Check server logs for vectorization errors
3. Verify PDF has readable text content
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
- CAdmin Uploads  │
│      PDF        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Save to DB    │─────▶│  Auto-Vectorize  │
│  & Cloudinary   │      │   (Background)   │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Vectra Index    │
                         │  (Ready to       │
                         │   Search)        │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┘
         │
         ▼
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
    Auto-Vectorization**: ~5 seconds per PDF (happens in background, doesn't block upload
┌─────────────────┐
│  Generate       │
│  Embedding      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Vectra Index──┐
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
``(One-time) Vectorize existing PDFs before auto-vectorization was implemented
node vectorize-resources.js

# Start backend (auto-vectorization enabled)
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
