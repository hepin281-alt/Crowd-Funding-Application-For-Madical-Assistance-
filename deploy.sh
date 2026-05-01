#!/bin/bash
# 🚀 DEPLOYMENT QUICK START - Run this file to verify everything is ready

set -e

echo "================================"
echo "🚀 DEPLOYMENT VERIFICATION"
echo "================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version
echo ""

# Check npm packages
echo "✓ Checking dependencies..."
cd backend
npm list >/dev/null 2>&1 && echo "  Backend: ✅ All dependencies installed" || echo "  Backend: ⚠️  Run 'npm install'"
cd ..

# Frontend
npm list >/dev/null 2>&1 && echo "  Frontend: ✅ All dependencies installed" || echo "  Frontend: ⚠️  Run 'npm install'"
echo ""

# Check production build
echo "✓ Building frontend for production..."
npm run build 2>/dev/null && echo "  ✅ Frontend build successful" || echo "  ❌ Build failed"
echo ""

# Check configuration files
echo "✓ Checking deployment configs..."
test -f vercel.json && echo "  ✅ vercel.json found"
test -f backend/Procfile && echo "  ✅ Procfile found"
test -f DEPLOYMENT.md && echo "  ✅ DEPLOYMENT.md found"
test -f .env.production && echo "  ✅ .env.production template found"
test -f backend/.env.production && echo "  ✅ backend/.env.production template found"
echo ""

# Final checklist
echo "================================"
echo "📋 DEPLOYMENT CHECKLIST"
echo "================================"
echo ""
echo "BEFORE DEPLOYING, YOU NEED:"
echo ""
echo "1️⃣  PostgreSQL Database"
echo "   [ ] DATABASE_URL ready"
echo "   [ ] Database is accessible from internet"
echo ""
echo "2️⃣  Gmail SMTP (for emails)"
echo "   [ ] Gmail account configured"
echo "   [ ] 2FA enabled"
echo "   [ ] App Password generated at myaccount.google.com/apppasswords"
echo ""
echo "3️⃣  Vercel Account"
echo "   [ ] Account created at vercel.com"
echo "   [ ] GitHub connected"
echo ""
echo "4️⃣  Render Account"
echo "   [ ] Account created at render.com"
echo "   [ ] GitHub connected"
echo ""
echo "5️⃣  JWT Secret"
echo "   [ ] Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "================================"
echo "✅ NEXT STEPS"
echo "================================"
echo ""
echo "1. Read DEPLOYMENT.md for detailed instructions"
echo "2. Open Terminal and have the following ready:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - Gmail credentials"
echo "3. Visit https://render.com and deploy backend"
echo "4. Visit https://vercel.com and deploy frontend"
echo "5. Test at your-app.vercel.app"
echo ""
