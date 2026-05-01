#!/bin/bash
# Generate required secrets for deployment

echo "🔐 DEPLOYMENT SECRETS GENERATOR"
echo "================================"
echo ""

# Generate JWT Secret
echo "JWT_SECRET (copy this to .env.production files):"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "$JWT_SECRET"
echo ""

# Other helpful info
echo "📝 ENVIRONMENT VARIABLES TEMPLATE:"
echo "================================"
echo ""
echo "Copy these to your platform's environment variables:"
echo ""
echo "=== RAILWAY BACKEND VARIABLES ==="
echo "NODE_ENV=production"
echo "PORT=3001"
echo "DATABASE_URL=YOUR_POSTGRESQL_URL_HERE"
echo "JWT_SECRET=$JWT_SECRET"
echo "EMAIL_HOST=smtp.gmail.com"
echo "EMAIL_PORT=587"
echo "EMAIL_USER=your-email@gmail.com"
echo "EMAIL_PASSWORD=YOUR_GMAIL_APP_PASSWORD"
echo "FRONTEND_URL=https://your-app.vercel.app"
echo "ALLOWED_ORIGINS=https://your-app.vercel.app"
echo ""
echo "=== VERCEL FRONTEND VARIABLES ==="
echo "VITE_API_URL=https://your-railway-url.railway.app/api"
echo ""
echo "================================"
echo ""
echo "⚠️  Make sure to replace YOUR_* placeholders with actual values!"
echo ""
