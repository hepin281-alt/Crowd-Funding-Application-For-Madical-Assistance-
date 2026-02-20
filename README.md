# CareFund - Medical Crowdfunding Platform

A transparent medical crowdfunding platform that connects patients in need with donors who want to help. Every campaign is verified by hospitals, and all donations are held in escrow until medical expenses are confirmed.

## Features

### Core Functionality
- **Hospital-Verified Campaigns**: Every campaign must be verified by the hospital where the patient is admitted
- **Escrow System**: Donations are held securely until hospital invoices are verified
- **Direct Hospital Payment**: Funds are paid directly to hospitals, ensuring proper use
- **Complete Transparency**: Track every donation and see fund utilization with receipts
- **Email Notifications**: Automated notifications for all key events

### User Roles

1. **Donor**: Browse and donate to verified campaigns
2. **Campaigner**: Create campaigns for patients in need
3. **Hospital Admin**: Verify campaigns for patients at their facility
4. **Platform Admin (Employee)**: Manage hospitals, verify invoices, trigger payouts

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd medical-crowdfunding
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ..
npm install
```

4. Configure environment variables

Create `backend/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/carefund
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
EMAIL_SERVICE=console
NODE_ENV=development
```

5. Initialize the database
```bash
cd backend
npm run seed
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend (in a new terminal)
```bash
npm run dev
```

3. Access the application at `http://localhost:5173`

## How It Works

### Campaign Flow

1. **Campaign Creation**
   - Campaigner creates a campaign with patient details
   - Selects hospital from verified database
   - System sends notification to hospital admin

2. **Hospital Verification**
   - Hospital admin receives email notification
   - Verifies patient admission using IPD/Registration number
   - Campaign goes live or gets rejected

3. **Donations**
   - Verified campaigns appear on public campaigns page
   - Donors can contribute any amount
   - Funds held in escrow
   - Donors receive email receipts

4. **Invoice Verification**
   - Campaigner uploads hospital invoices
   - Platform admin matches invoices with donations
   - Verifies authenticity

5. **Fund Disbursement**
   - Verified funds paid directly to hospital
   - Donors receive utilization receipts
   - Campaign marked as completed

## Database Schema

### PostgreSQL Tables
- **users**: All user accounts (donors, campaigners, hospital admins, employees)
- **hospitals**: Verified hospital database
- **campaigns**: Fundraising campaigns
- **donations**: Individual donations
- **disbursement_requests**: Invoice-based payout requests
- **transactions**: Payment records
- **receipts**: Donation utilization receipts

## Email Notifications

The platform sends automated emails for:
- Campaign verification requests to hospitals
- Campaign approval/rejection to campaigners
- Donation receipts to donors
- Fund disbursement confirmations

### Email Configuration

By default, emails are logged to console. To enable real email sending:

1. **SMTP** (e.g., Gmail, Outlook)
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. **SendGrid**
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-identity` - Verify employee/hospital admin

### Campaigns
- `GET /api/campaigns` - List verified campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns/my` - Get my campaigns (campaigner)
- `POST /api/campaigns` - Create campaign

### Donations
- `POST /api/donations` - Make donation
- `GET /api/donations/my` - Get my donations

### Hospital Admin
- `GET /api/hospital-admin/pending` - Get pending verifications
- `POST /api/hospital-admin/verify/:id` - Verify campaign
- `POST /api/hospital-admin/reject/:id` - Reject campaign

### Hospitals
- `GET /api/hospitals` - List verified hospitals

## Development

### Project Structure
```
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Email notifications
│   ├── scripts/        # Database seeding
│   └── server.js       # Express server
├── src/
│   ├── api/           # API client
│   ├── components/    # React components
│   ├── context/       # Auth context
│   ├── pages/         # Page components
│   └── main.jsx       # React entry point
└── README.md
```

### Key Technologies
- **Backend**: Node.js, Express, Sequelize, PostgreSQL
- **Frontend**: React, React Router, Vite
- **Authentication**: JWT
- **Styling**: Custom CSS

## Recent Updates

### Version 2.0 (Latest)

1. **Database Consolidation**
   - Removed MongoDB dependency
   - All data now in PostgreSQL
   - Removed redundant MedicalCase model

2. **Enhanced Landing Page**
   - Added "How It Works" section with 6-step workflow
   - Added "What is CareFund?" section
   - Added trust indicators and features grid
   - Added "Why Trust CareFund?" section

3. **Campaign Detail Page**
   - Full campaign information display
   - Visual timeline showing campaign progress
   - Hospital verification details
   - Donation form integrated
   - Trust & safety indicators
   - Social sharing functionality

4. **Improved Notifications**
   - Professional email templates
   - Notifications for campaign verification
   - Notifications for campaign rejection
   - Donation receipt emails
   - Fund disbursement confirmations
   - Configurable email service (console/SMTP/SendGrid)

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints
- SQL injection protection via Sequelize ORM

## Future Enhancements

- Payment gateway integration (Razorpay, Stripe)
- File upload for invoices and documents
- In-app notification system
- Campaign comments and updates
- Social media sharing
- Mobile app
- Analytics dashboard
- Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
