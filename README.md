# Crowd-Funding Application For Medical Assistance

A comprehensive platform designed to connect patients in need of financial support with generous donors. This application streamlines the process of creating medical fundraising campaigns, managing donations, and verifying hospital credentials.

## 🎯 Features

### For Patients/Campaign Creators
- Create and manage medical fundraising campaigns
- Track campaign progress and donations
- Access personalized dashboard with campaign analytics
- Upload supporting medical documents and invoices

### For Donors
- Browse active medical campaigns
- Make secure donations to campaigns of choice
- View donation history and receipts
- Access donor dashboard

### For Hospital Staff & Admins
- Hospital verification and credentialing system
- Medical case management and documentation
- Invoice upload and tracking
- Employee account management
- Hospital admin dashboard for operations oversight

### For System Administrators
- User identity verification
- Hospital credential verification
- Overall system management and monitoring

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **CSS** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Authentication** - JWT-based authentication middleware

## 📋 Prerequisites

Before getting started, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or Atlas connection string)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Crowd-Funding
```

### 2. Frontend Setup

Navigate to the root directory and install dependencies:
```bash
npm install
```

Create a `.env.local` file for frontend environment variables:
```
VITE_API_URL=http://localhost:5000
```

### 3. Backend Setup

Navigate to the backend directory:
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/crowdfunding
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## 💻 Running the Application

### Start the Backend Server
```bash
cd backend
npm start
```

The backend server will run on `http://localhost:5000`

### Start the Frontend Development Server
From the root directory:
```bash
npm run dev
```

The frontend will typically run on `http://localhost:5173`

### Seed Database (Optional)
To populate sample data:
```bash
cd backend
npm run seed
```

## 📁 Project Structure

```
Crowd-Funding/
├── src/                          # Frontend source code
│   ├── components/              # Reusable React components
│   │   ├── CampaignCard.jsx
│   │   ├── CaseCard.jsx
│   │   ├── Layout.jsx
│   │   └── Navbar.jsx
│   ├── pages/                   # Page components
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Campaigns.jsx
│   │   ├── Cases.jsx
│   │   ├── CampaignCreate.jsx
│   │   ├── CampaignerDashboard.jsx
│   │   ├── DonorDashboard.jsx
│   │   ├── HospitalAdminDashboard.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── HospitalVerify.jsx
│   │   ├── InvoiceUpload.jsx
│   │   └── VerifyIdentity.jsx
│   ├── context/                 # React Context
│   │   └── AuthContext.jsx
│   ├── api/                     # API client configuration
│   │   └── client.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── backend/                      # Backend source code
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── Campaign.js
│   │   ├── Donation.js
│   │   ├── Hospital.js
│   │   ├── MedicalCase.js
│   │   ├── DisbursementRequest.js
│   │   ├── Transaction.js
│   │   ├── Receipt.js
│   │   └── index.js
│   ├── routes/                  # API endpoints
│   │   ├── auth.js
│   │   ├── campaigns.js
│   │   ├── cases.js
│   │   ├── donations.js
│   │   ├── hospitals.js
│   │   ├── hospitalAdmin.js
│   │   ├── employee.js
│   │   ├── invoices.js
│   │   └── receipts.js
│   ├── middleware/              # Custom middleware
│   │   └── auth.js
│   ├── config/                  # Configuration files
│   │   ├── database.js
│   │   └── db.js
│   ├── services/                # Utility services
│   │   └── notify.js
│   ├── scripts/                 # Utility scripts
│   │   └── seed.js
│   ├── server.js
│   └── package.json
├── public/                       # Static assets
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

### Campaign Routes (`/api/campaigns`)
- `GET /` - Get all campaigns
- `POST /` - Create new campaign
- `GET /:id` - Get campaign details
- `PUT /:id` - Update campaign
- `DELETE /:id` - Delete campaign

### Donation Routes (`/api/donations`)
- `POST /` - Create donation
- `GET /` - Get donation history
- `GET /:id` - Get donation details

### Medical Cases Routes (`/api/cases`)
- `GET /` - Get all medical cases
- `POST /` - Create medical case
- `GET /:id` - Get case details
- `PUT /:id` - Update case

### Hospital Routes (`/api/hospitals`)
- `GET /` - Get all hospitals
- `POST /` - Register hospital
- `GET /:id` - Get hospital details

### Hospital Admin Routes (`/api/hospital-admin`)
- `GET /dashboard` - Admin dashboard data
- `POST /verify-staff` - Verify hospital staff

### Employee Routes (`/api/employee`)
- `GET /dashboard` - Employee dashboard

### Invoice Routes (`/api/invoices`)
- `POST /upload` - Upload invoice
- `GET /` - Get invoices

### Receipt Routes (`/api/receipts`)
- `GET /` - Get receipts
- `GET /:id` - Get receipt details

## 🔐 Authentication

The application uses JWT (JSON Web Token) based authentication. All protected routes require a valid JWT token in the authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm start` - Start server
- `npm run seed` - Seed database with sample data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@crowdfunding.com or open an issue in the repository.

## 🙏 Acknowledgments

- Medical community and healthcare providers
- All contributors and donors supporting this cause
- Open source community for amazing tools and libraries
