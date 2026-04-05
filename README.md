# BudMap - Budget Management Application 💰

Budget Allocation Application for SMEs, NGOs, and Educational Institutions in Nepal

## 🚀 Quick Start Guide

### Option 1: Automated Setup (Recommended)

**Windows Users**: Simply double-click `start.bat` file

This will automatically:
1. Rename "Frontain" to "Frontend" (if needed)
2. Create necessary .env files
3. Install all dependencies
4. Start both Backend and Frontend servers

### Option 2: Manual Setup

#### Step 1: Rename Frontend Folder

If you have a folder named "Frontain", rename it to "Frontend":

```bash
# In project root directory
cd "C:\budget management"
rename Frontain Frontend
```

#### Step 2: Install Dependencies

```bash
cd "C:\budget management"
npm run install-all
```

This will install dependencies for:
- Root project
- Backend
- Frontend

#### Step 3: Verify Environment Files

**Backend** (`Backend\.env`) - Already exists ✅
```
PORT=5000
JWT_SECRET=budmap_secret_key_2024_nepal_fyp
JWT_EXPIRES_IN=7d
```

**Frontend** (`Frontend\.env`) - Created for you ✅
```
REACT_APP_API_URL=http://localhost:5000/api
```

#### Step 4: Start the Application

**Start both servers together:**
```bash
npm start
```

**Or start separately:**

Backend:
```bash
cd Backend
npm start
```

Frontend:
```bash
cd Frontend
npm start
```

## 📱 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔐 Default Login Credentials

### Admin Account (Full Access)
- **Email**: `admin@budmap.com`
- **Password**: `admin123`
- Full system administration
- User and organization management
- Complete budget control

### Finance Officer Account
- **Email**: `finance@budmap.com`
- **Password**: `finance123`
- Budget creation and approval
- Transaction management
- Financial reports

### Department Head Account
- **Email**: `department@budmap.com`
- **Password**: `dept123`
- Department budget management
- Transaction creation
- Department reports

### Viewer Account (Read-Only)
- **Email**: `viewer@budmap.com`
- **Password**: `viewer123`
- View budgets and transactions
- View reports
- No modification rights

## 📁 Project Structure

```
budget management/
├── Backend/                    # Express.js Backend
│   ├── data/
│   │   └── store.js           # In-memory data store
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/                # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── budgets.js
│   │   ├── departments.js
│   │   ├── notifications.js
│   │   ├── organizations.js
│   │   ├── reports.js
│   │   ├── transactions.js
│   │   └── users.js
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── Frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout.js
│   │   │   └── Layout.css
│   │   ├── context/          # React Context
│   │   │   └── AuthContext.js
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── BudgetsPage.js
│   │   │   ├── TransactionsPage.js
│   │   │   ├── ReportsPage.js
│   │   │   ├── DepartmentsPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── UsersPage.js
│   │   │   └── OrganizationsPage.js
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.js            # Main app component
│   │   ├── index.js          # Entry point
│   │   └── index.css         # Global styles
│   ├── .env                  # Environment variables
│   └── package.json
│
├── package.json              # Root package.json
├── start.bat                 # Quick start script
├── ERROR_FIXES.md           # Error documentation
└── README.md                # This file
```

## 🎯 Key Features

### For All Users
- 🔐 Secure authentication with JWT
- 📊 Interactive dashboard with charts
- 📱 Responsive design (mobile-friendly)
- 🌓 Dark/Light theme toggle
- 🔔 Real-time notifications
- 👤 Profile management

### Budget Management
- 💰 Create and manage budgets
- 📅 Fiscal year tracking
- 🏢 Organization and department-level budgets
- 📈 Budget allocation tracking
- ⚠️ Budget utilization alerts

### Transaction Management
- 💳 Income and expense tracking
- ✅ Multi-level approval workflow
- 📝 Detailed transaction history
- 🔍 Advanced filtering and search
- 📄 Receipt attachment support

### Reporting & Analytics
- 📊 Financial reports
- 📈 Budget performance analysis
- 🏢 Department-wise reports
- 📉 Expense trend analysis
- 📥 Export to Excel/PDF

### Administration (Admin Only)
- 👥 User management
- 🏢 Organization management
- 🔧 System settings
- 📋 Activity logs
- 📊 System-wide analytics

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module 'express'"
**Solution**: Install backend dependencies
```bash
cd Backend
npm install
```

### Issue: "Cannot find module 'react'"
**Solution**: Install frontend dependencies
```bash
cd Frontend
npm install
```

### Issue: Port 5000 already in use
**Solution**: Change port in `Backend\.env`
```
PORT=5001
```
Then update `Frontend\.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
```

### Issue: Folder name is still "Frontain"
**Solution**: Rename manually or use start.bat script
```bash
rename Frontain Frontend
```

### Issue: CORS errors
**Solution**: Ensure both servers are running:
- Backend on port 5000
- Frontend on port 3000

### Issue: White screen after login
**Solution**: Check browser console (F12) for errors. Usually missing dependencies.

## 📝 Development Notes

### Current Implementation
- ✅ In-memory data storage (store.js)
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Complete CRUD operations
- ✅ Responsive UI design
- ✅ Dark/Light theme

### Future Enhancements
- 📝 PostgreSQL database integration
- 📝 File upload for receipts
- 📝 Email notifications
- 📝 PDF report generation
- 📝 Advanced analytics
- 📝 Multi-language support
- 📝 Mobile app (React Native)

## 🧪 Testing

### Manual Testing Steps

1. **Login Test**
   - Try all 4 test accounts
   - Verify correct dashboard loads
   - Check role-based access

2. **Budget Management**
   - Create new budget (as Admin/Finance)
   - Update budget
   - Check budget calculations

3. **Transaction Management**
   - Create income transaction
   - Create expense transaction
   - Test approval workflow

4. **Reports**
   - Generate financial report
   - Export report
   - Check data accuracy

5. **Admin Features**
   - Create new user
   - Create organization
   - View activity logs

## 📄 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/password` - Update password
- `POST /api/auth/logout` - Logout

### Budget Endpoints
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get budget by ID
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `POST /api/budgets/:id/approve` - Approve budget

### Transaction Endpoints
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/:id/approve` - Approve transaction
- `POST /api/transactions/:id/reject` - Reject transaction

### Department Endpoints
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Report Endpoints
- `GET /api/reports/financial` - Financial report
- `GET /api/reports/budget-performance` - Budget performance
- `GET /api/reports/department-wise` - Department-wise report
- `GET /api/reports/expense-trends` - Expense trends

## 🤝 Contributing

This is a Final Year Project (FYP) for academic purposes.

**Author**: Reazon Koirala  
**Purpose**: Budget management for SMEs, NGOs, and Educational Institutions in Nepal  
**Academic Year**: 2024-2025

## 📞 Support

If you encounter any issues:

1. Check `ERROR_FIXES.md` for detailed troubleshooting
2. Verify all dependencies are installed
3. Check that both Backend and Frontend are running
4. Review browser console (F12) for errors
5. Check backend terminal for error messages

## ⚠️ Important Notes

- **Data Persistence**: Currently using in-memory storage. Data will be lost on server restart.
- **Security**: Default JWT secret is for development only. Change in production.
- **File Uploads**: Not implemented yet. Planned for future versions.
- **Email**: Email notifications are planned but not implemented.
- **Production**: This is a development version. Additional security measures needed for production.

## 📜 License

MIT License - This is an academic project for learning purposes.

---

**Happy Budget Managing! 💰📊**

For any questions or issues, please refer to ERROR_FIXES.md file.
