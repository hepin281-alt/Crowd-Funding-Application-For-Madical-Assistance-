# 🚀 Deployment Guide - Vercel + Railway

This guide covers deploying your Medical Crowdfunding app to production using:
- **Frontend**: Vercel (Free tier - ideal for React/Vite apps)
- **Backend**: Railway (Free $5/month credit)
- **Database**: Your existing PostgreSQL

## Prerequisites
- GitHub repository (push code there)
- Vercel account (free at vercel.com)
- Railway account (free at railway.app)

---

## PART 1: Prepare & Push Code to GitHub

### Step 1.1: Commit deployment files
```bash
cd /Users/hepin/Desktop/Crowd-Funding-Application-For-Madical-Assistance-
git add -A
git commit -m "chore: Add production deployment configuration

- Create vercel.json for frontend deployment
- Add .env.production templates for frontend and backend
- Add Procfile for Railway backend deployment
- Update CORS to support production origins dynamically"
git push origin main
```

---

## PART 2: Deploy Backend to Railway

### Step 2.1: Create Railway Account & Project
1. Go to https://railway.app
2. Sign up (GitHub recommended)
3. Click "New Project" → "Deploy from GitHub"
4. Select this repository

### Step 2.2: Configure Environment Variables in Railway
In Railway dashboard, go to **Variables** and add:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_strong_secret_min_32_chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=https://your-app.vercel.app (update after Vercel deployment)
ALLOWED_ORIGINS=https://your-app.vercel.app
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Important**: Replace placeholder values with real ones.

### Step 2.3: Set Build & Start Commands
In Railway **Settings**:
- Build Command: `npm install` (already in backend/)
- Start Command: `node server.js`

### Step 2.4: Generate Railway Domain
Railway will assign a domain like: `https://crowdfunding-api.railway.app`

**Save this URL** - you'll need it for frontend configuration.

---

## PART 3: Deploy Frontend to Vercel

### Step 3.1: Create Vercel Account & Project
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Select "Other" as framework (it will auto-detect Vite)

### Step 3.2: Set Environment Variables in Vercel
In Vercel **Settings** → **Environment Variables**, add:

```
VITE_API_URL=https://your-railway-domain.railway.app/api
```

(Replace with actual Railway URL from Step 2.4)

### Step 3.3: Configure Build Settings
In Vercel **Settings**:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `./` (not needed since it's in root)

### Step 3.4: Deploy
Click "Deploy" - Vercel will build and deploy automatically.
**Save your Vercel URL**: `https://your-app.vercel.app`

---

## PART 4: Finalize Production Configuration

### Step 4.1: Update Backend with Frontend URL
Go back to Railway dashboard → **Variables**:
- Update `FRONTEND_URL` with your Vercel URL
- Update `ALLOWED_ORIGINS` with your Vercel URL

### Step 4.2: Test API Connection
1. Open your Vercel app
2. Try logging in or creating a campaign
3. Check browser console for errors
4. Check Railway logs for backend errors

### Step 4.3: Redeploy if Needed
If you updated environment variables:
- **Railway**: Auto-redeploys when env vars change
- **Vercel**: May need manual redeployment

Go to Vercel → **Deployments** → Click latest → "Redeploy"

---

## Important Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_URL=https://backend-url.railway.app/api
```

### Backend (.env.production)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=min-32-character-long-secret-string
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=google-app-password
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
UPLOAD_DIR=./uploads
```

---

## Getting Gmail App Password (for emails)

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication if not already done
3. Go to "App passwords" 
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Use this as `EMAIL_PASSWORD` in environment variables

---

## Troubleshooting

### "Failed to connect to API"
- Check VITE_API_URL in Vercel environment variables
- Check Railway domain is correct
- Verify CORS origins in Railway environment

### "Database connection failed"
- Verify DATABASE_URL is correct and accessible
- Check if database server is running
- Test connection locally first

### "Emails not sending"
- Verify EMAIL_USER and EMAIL_PASSWORD
- Check if Gmail App Password is used (not regular password)
- Check Railway logs for nodemailer errors

### Railway logs not showing
```bash
# View logs locally or use Railway CLI
railway up
railway logs
```

---

## Cost Breakdown (Free Tier)

| Service | Free Limit | Cost |
|---------|-----------|------|
| **Vercel** | 100GB bandwidth/month | $0 (generous free tier) |
| **Railway** | $5/month credit | $0 (with free credits) |
| **PostgreSQL** | Managed externally | Your cost |

Total: **$0** if you have PostgreSQL already set up elsewhere.

---

## Next Steps After Deployment

1. ✅ Test all user workflows (signup, donation, campaigns)
2. ✅ Test admin workflows (payouts, approvals)
3. ✅ Monitor logs for errors
4. ✅ Set up monitoring alerts (Railway dashboard)
5. ✅ Plan for scaling if needed

---

## Useful Links

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://railway.app/docs
- Environment Variables: https://railway.app/docs/guides/environment
- Database Backups: Set up automated backups for your PostgreSQL

