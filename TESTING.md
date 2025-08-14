# 🧪 Testing Guide - Sarepta FDA RAG Workflow

This guide explains how to test the RAG (Retrieval-Augmented Generation) workflow before deployment.

## 🎯 Why Test?

The RAG system has multiple complex components:
- Document loading and processing (51 PDFs)
- Multi-agent orchestration workflow
- OpenAI API integration with fallbacks
- Citation generation and linking
- Dual deployment modes (static vs server)

Testing ensures everything works correctly before users interact with the system.

## ⚡ Quick Testing

**Before every deployment:**
```bash
npm run pre-deploy
```

This runs the complete test suite and builds the static version if all tests pass.

## 🔬 Test Suites

### 1. Component Structure Tests
```bash
npm run test:components
```

**Validates:**
- ✅ All required files exist
- ✅ Core functions are present
- ✅ Imports are correct
- ✅ Configuration is valid

**Example Output:**
```
🔬 Direct Orchestrator Component Tests
======================================
✅ Core File: src/agents/Orchestrator.ts
✅ Method: execute
✅ Import: DocumentProcessor
```

### 2. Workflow Functionality Tests
```bash
npm run test:workflow
```

**Validates:**
- ✅ Server health (dev server running)
- ✅ Document loading (51 PDFs across categories)
- ✅ API integration (responses work)
- ✅ Rich context processing (citations generated)
- ✅ Query pipeline (4 test queries)
- ✅ Deployment readiness

**Example Output:**
```
🧪 Sarepta FDA RAG Workflow Test Suite
============================================
✅ Server Health - Development server is running
✅ PDF Files - Found 51 PDF files
✅ Citation Generation - Found 3 citations in response
✅ Query Processing - All 4 queries succeeded
```

## 📋 Test Scenarios

### Test Queries
The workflow tests run these queries:
1. **Safety:** "What safety concerns were raised about Elevidys?"
2. **Clinical:** "What were the clinical trial results?"  
3. **Regulatory:** "What was the FDA approval basis?"
4. **Mechanism:** "How does Elevidys work?"

### Expected Results
- **Response time:** < 10 seconds per query
- **Citations:** At least 1 numbered citation per response
- **Content quality:** Mentions relevant terms (hepatotoxicity, EMBARK, etc.)
- **API health:** 200 status codes for all requests

## 🚨 Troubleshooting

### Server Not Running
```
❌ Server Health - Cannot connect to server
💡 Make sure to run "npm run dev" first
```
**Fix:** Start dev server: `npm run dev`

### Missing Files
```
❌ Core File: src/agents/Orchestrator.ts
```
**Fix:** Check git status, ensure all files are committed

### API Failures
```
❌ API Integration - fetch failed
```
**Fix:** Check OpenAI API key in `.env.local` or verify fallback logic

### Poor Response Quality
```
⚠️ Context Understanding - Response may not fully address context
```
**Fix:** Check document loading and Orchestrator search logic

## 📊 Test Results Interpretation

### All Tests Pass ✅
```
📊 Test Summary
===============
✅ ALL TESTS PASSED (6/6)
🚀 Ready for deployment!
```
**Action:** Safe to deploy using `npm run build:static` or `npm run build`

### Some Tests Fail ❌
```
📊 Test Summary  
===============
❌ 2 TEST(S) FAILED (4/6 passed)
⚠️ Fix issues before deployment
```
**Action:** Review failed tests, fix issues, rerun tests

## 🔄 CI/CD Integration

For automated testing, add to your workflow:

```yaml
# .github/workflows/test.yml
name: Test RAG Workflow
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run dev &
      - run: sleep 10  # Wait for server
      - run: npm run test
```

## 🎯 Testing Best Practices

1. **Always test before deployment**
   ```bash
   npm run pre-deploy
   ```

2. **Test both deployment modes:**
   ```bash
   # Static deployment (GitHub Pages)
   NEXT_EXPORT=true npm run test
   
   # Server deployment (Vercel/Netlify)  
   npm run test
   ```

3. **Verify document changes:**
   - When adding/removing PDFs: Check document count in tests
   - When changing categories: Update category tests

4. **Test API key scenarios:**
   - With API key: Real OpenAI responses
   - Without API key: Intelligent fallbacks

## 📈 Performance Benchmarks

**Acceptable Performance:**
- Server startup: < 5 seconds
- API response: < 10 seconds per query
- Static build: < 30 seconds
- Test suite: < 60 seconds total

**Document Loading:**
- 51 PDFs should load correctly
- 5 categories: FDA (24), Publication (19), Press Report (4), SEC (2), Abstract (2)

---

**Remember:** Testing validates that your RAG system can successfully analyze Sarepta's complex regulatory and clinical data before users depend on it! 🔬✅
