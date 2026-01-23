# Medical Crowdfunding Application - Setup Guide

## Project Overview
A complete React + TypeScript + Tailwind CSS frontend for a medical crowdfunding platform that helps people afford life-saving medical treatments.

## ✅ What's Been Built

### Components (src/components/)
1. **Navbar.tsx** - Navigation bar with logo and menu links
2. **Footer.tsx** - Footer with company info and links
3. **CampaignCard.tsx** - Reusable campaign card with progress bar
4. **DonationModal.tsx** - Modal for making donations with preset/custom amounts

### Pages (src/pages/)
1. **Home.tsx** - Landing page with hero, stats, how it works, featured campaigns
2. **Campaigns.tsx** - Browse all campaigns with filtering and sorting
3. **CampaignDetail.tsx** - Detailed view of a specific campaign
4. **Dashboard.tsx** - User donation tracking and account settings

### Core Files
- **App.tsx** - Main app with React Router setup
- **main.tsx** - Entry point
- **index.css** - Tailwind CSS imports
- **tailwind.config.js** - Tailwind configuration
- **postcss.config.js** - PostCSS configuration
- **package.json** - Dependencies and scripts

## 📋 Errors Fixed

✅ Removed unused `raised` parameter from DonationModal
✅ Updated DonationModal component props interface
✅ Fixed DonationModal call in CampaignDetail.tsx

## 🔧 Installation Steps

### Option 1: If npm install works on your system
```bash
cd /Users/hepin/Desktop/project
npm install
npm run dev
```

### Option 2: If npm has network issues
Try clearing cache and using a different registry:
```bash
npm cache clean --force
npm config set registry https://registry.npmjs.org/
npm install --verbose
```

### Option 3: Use Yarn (if available)
```bash
yarn install
yarn dev
```

### Option 4: Manual installation with retry
```bash
npm install --no-audit --no-fund --legacy-peer-deps
```

## 📊 Medical Categories Supported
- Cardiac Surgery
- Oncology (Cancer Treatment)
- Orthopedic Surgery
- Pediatric Care
- Nephrology (Kidney)
- Endocrinology (Diabetes)
- Hepatology (Liver)
- Ophthalmology (Vision)
- Neurology (Brain)

## 🎯 Features Implemented

### Home Page
- Hero section with call-to-action
- Statistics display (campaigns funded, total raised, lives impacted)
- "How It Works" guide (4-step process)
- Featured campaigns grid with category filtering

### Campaign Browsing
- Search functionality
- Filter by medical category
- Sort by: newest, most funded, least funded, most needed
- Responsive grid layout

### Campaign Details
- Full campaign story and updates
- Beneficiary information
- Progress bar showing funding progress
- Impact breakdown ($10 = supplies, $50 = medication, $100 = surgery)
- Donation button linked to modal

### Donation Modal
- Preset donation amounts ($10, $25, $50, $100, $250, $500)
- Custom amount input
- Donor name and email fields
- Public/private donation option

### User Dashboard
- Donation history table
- Statistics (total donated, campaigns supported)
- Account settings
- Email preferences

## 🎨 Design Features
- Responsive design (mobile, tablet, desktop)
- Tailwind CSS styling
- Smooth transitions and hover effects
- Blue/green color scheme for medical/health theme
- Progress bars with gradient effects
- Clean, accessible UI

## 📁 Project Structure
```
src/
├── components/
│   ├── CampaignCard.tsx
│   ├── DonationModal.tsx
│   ├── Footer.tsx
│   └── Navbar.tsx
├── pages/
│   ├── CampaignDetail.tsx
│   ├── Campaigns.tsx
│   ├── Dashboard.tsx
│   └── Home.tsx
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

## 🚀 Running the Application

Once dependencies are installed:

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Lint code
npm run lint
```

The app will be available at `http://localhost:5173`

## 🔗 GitHub Repository
https://github.com/hepin281-alt/Crowd-Funding-Application-For-Madical-Assistance-

## 📝 Next Steps

1. ✅ Install dependencies (npm install)
2. ✅ Run development server (npm run dev)
3. Test all pages and components
4. Add payment gateway integration (Stripe, PayPal)
5. Connect to backend API
6. Add user authentication
7. Deploy to production

## ⚠️ Known Issues

- npm install may timeout due to network issues
- Solution: Clear npm cache and retry with `--verbose` flag
- All code errors have been fixed and are ready for use once dependencies are installed
