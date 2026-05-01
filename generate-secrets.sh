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
echo "=== RENDER BACKEND VARIABLES ==="
echo "NODE_ENV=production"
echo "PORT=3001"
echo "DATABASE_URL=YOUR_POSTGRESQL_URL_HERE"
echo "JWT_SECRET=$JWT_SECRET"
echo "EMAIL_SERVICE=smtp"
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_SECURE=false"
echo "SMTP_USER=your-email@gmail.com"
echo "SMTP_PASS=YOUR_GMAIL_APP_PASSWORD"
echo "EMAIL_FROM=your-email@gmail.com"
echo "EMAIL_FROM_NAME=CareFund"
echo "FRONTEND_URL=https://your-app.vercel.app"
echo "ALLOWED_ORIGINS=https://your-app.vercel.app"
echo ""
echo "=== VERCEL FRONTEND VARIABLES ==="
echo "VITE_API_URL=https://your-backend.onrender.com/api"
echo ""
echo "================================"
echo ""
echo "⚠️  Make sure to replace YOUR_* placeholders with actual values!"
echo ""
