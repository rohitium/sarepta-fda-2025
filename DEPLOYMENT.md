# 🚀 Deployment Guide - Sarepta FDA Analysis Framework

This application supports **two deployment modes** with different security and functionality levels.

## 📋 Overview

| Feature | GitHub Pages (Static) | Server Deployment (Vercel/Netlify) |
|---------|----------------------|-------------------------------------|
| **Security** | ✅ No API key exposure | ✅ Server-side API key protection |
| **AI Responses** | ❌ Mock responses only | ✅ Real OpenAI API responses |
| **PDF Viewing** | ✅ Full support | ✅ Full support |
| **Document Search** | ✅ Full support | ✅ Full support |
| **Cost** | 🆓 Free hosting | 💰 Hosting + API costs |
| **Setup Complexity** | 🟢 Simple | 🟡 Moderate |

---

## 🔐 Security Strategy

### GitHub Pages (Recommended for Demos)
- **✅ SECURE**: No API keys in client code
- **✅ SAFE**: No server-side vulnerabilities  
- **✅ FREE**: No hosting or API costs
- Uses intelligent mock responses with real clinical data

### Server Deployment (Recommended for Production)
- **✅ SECURE**: API key stays server-side only
- **✅ LIVE**: Real OpenAI API responses
- **✅ SCALABLE**: Full Next.js features
- API key never exposed to client

---

## 📦 Deployment Options

### Option 1: GitHub Pages (Static Export) 🆓

**Perfect for:** Demos, portfolios, proof-of-concepts

```bash
# Build for GitHub Pages
npm run build:static

# Deploy to GitHub Pages (manual)
npm run deploy

# Or use GitHub Actions (automatic)
git push origin main
```

**GitHub Actions Setup:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:static
      - uses: actions/deploy-pages@v3
        with:
          path: ./out
```

### Option 2: Vercel (Server Deployment) ⚡

**Perfect for:** Production apps, live AI responses

1. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **Build Configuration:**
   - Uses regular `npm run build` (automatic)
   - API routes enabled
   - Server-side rendering available

### Option 3: Netlify (Server Deployment) 🌐

**Perfect for:** Production apps with form handling

1. **Deploy to Netlify:**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

2. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

---

## 🛠️ Configuration

### Environment Variables

#### For Server Deployments (Vercel/Netlify):
```bash
# .env.local (DO NOT commit this file)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
NODE_ENV=production
```

#### For GitHub Pages:
```bash
# No environment variables needed!
# API key security handled automatically
```

### Build Commands

```bash
# Development (with hot reload)
npm run dev

# Production build (server deployment)
npm run build

# Static export (GitHub Pages)
npm run build:static

# Deploy to GitHub Pages
npm run deploy
```

---

## 🔍 How It Works

### Automatic Deployment Detection

The app automatically detects deployment type:

```javascript
// Detects GitHub Pages
const isStaticDeployment = 
  process.env.NEXT_EXPORT === 'true' || 
  window.location.hostname.includes('github.io');

// Routes accordingly
if (isStaticDeployment) {
  // Use enhanced mock responses
} else {
  // Use secure API routes
}
```

### Security Features

1. **API Key Protection:**
   - Server deployments: API key stays on server
   - Static deployments: No API key needed
   - Never exposed to client code

2. **Graceful Fallbacks:**
   - API failures → intelligent mock responses  
   - Missing keys → demo mode
   - Build errors → handled gracefully

3. **Content Security:**
   - PDFs served with proper headers
   - No XSS vulnerabilities
   - Clean separation of concerns

---

## 📊 Performance

### GitHub Pages
- **Load Time:** ~2s (static files)
- **Response Time:** Instant (mock responses)
- **Bandwidth:** Minimal (no API calls)

### Server Deployment  
- **Load Time:** ~1s (SSR optimization)
- **Response Time:** 2-5s (OpenAI API)
- **Bandwidth:** Moderate (API calls)

---

## 🚨 Security Best Practices

### ✅ DO:
- Use server deployments for production with real users
- Set API keys as environment variables only  
- Use GitHub Pages for demos and portfolios
- Monitor API usage and costs
- Implement rate limiting for production

### ❌ DON'T:
- Put API keys in client code
- Commit `.env.local` files
- Use `NEXT_PUBLIC_` prefix for sensitive keys
- Deploy server code to static hosts
- Ignore error handling

---

## 🎯 Recommendations

### For Different Use Cases:

**🎓 Academic/Research:** GitHub Pages
- Free hosting
- Perfect for demonstrations
- No security concerns
- Easy maintenance

**💼 Business/Production:** Vercel/Netlify  
- Live AI responses
- Better user experience
- Scalable infrastructure
- Professional deployment

**🛠️ Development:** Local + Both
- `npm run dev` for development
- Test both deployment modes
- Verify security before production

---

## 📞 Support

### Common Issues:

**Q: Build fails with "OPENAI_API_KEY missing"**  
A: Use `npm run build:static` for GitHub Pages

**Q: API calls fail in production**  
A: Check environment variables in deployment platform

**Q: PDFs don't load**  
A: Verify basePath configuration for your domain

**Q: Static export but want real AI**  
A: Switch to server deployment (Vercel/Netlify)

### Getting Help:

1. Check this deployment guide
2. Review error logs in deployment platform  
3. Test locally with `npm run dev`
4. Verify environment variable configuration

---

**🔒 Remember: Security first! Choose the deployment method that matches your security requirements and use case.**
