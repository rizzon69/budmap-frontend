# 🚀 BudMap Enhanced Features - Complete Documentation

## Version 2.0.0 - Enhanced Edition

---

## 📋 Table of Contents

1. [New Features Overview](#new-features-overview)
2. [Installation & Setup](#installation--setup)
3. [API Documentation](#api-documentation)
4. [Feature Details](#feature-details)
5. [Testing Guide](#testing-guide)
6. [Migration Path](#migration-path)

---

## 🎯 New Features Overview

### ✅ Implemented Features

#### 1. **Enhanced User Registration System**
- ✅ Organization self-registration
- ✅ User self-registration
- ✅ Email verification system
- ✅ Approval workflow for new users

#### 2. **Advanced Authentication**
- ✅ Email verification tokens
- ✅ Password recovery/reset via email
- ✅ Session management
- ✅ Security enhancements

#### 3. **Internal Messaging System**
- ✅ Direct messaging between users
- ✅ Message threads/conversations
- ✅ Read receipts
- ✅ Unread message count
- ✅ Message search and filtering

#### 4. **Advanced Analytics Dashboard**
- ✅ Real-time budget utilization tracking
- ✅ Department-wise analytics
- ✅ Monthly spending trends
- ✅ Budget vs actual comparisons
- ✅ Financial health indicators

#### 5. **Budget Forecasting & Predictions**
- ✅ AI-based spending predictions
- ✅ Budget exhaustion date predictions
- ✅ Confidence levels in forecasts
- ✅ Historical pattern analysis
- ✅ Smart recommendations

#### 6. **Spending Pattern Analysis**
- ✅ Day-of-week spending patterns
- ✅ Time-of-month analysis
- ✅ Transaction amount distribution
- ✅ Automated insights generation

#### 7. **Enhanced Security**
- ✅ Token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Email verification
- ✅ Secure password reset
- ✅ Activity logging

---

## 🛠️ Installation & Setup

### Step 1: Update Backend Dependencies

```bash
cd "C:\budget management\Backend"
npm install
```

This will install all new dependencies:
- nodemailer (email functionality)
- multer (file uploads)
- pdfkit (PDF generation)
- exceljs (Excel exports)
- helmet (security headers)
- winston (logging)
- rate-limiter-flexible (rate limiting)

### Step 2: Restart Server

```bash
npm start
```

Or from project root:
```bash
npm start
```

### Step 3: Verify Installation

Visit: http://localhost:5000/

You should see version 2.0.0 and new features listed.

---

## 📚 API Documentation

### 🆕 Registration Endpoints

#### POST /api/registration/organization
Register a new organization and admin user.

**Request Body:**
```json
{
  "orgName": "My Organization",
  "orgType": "ngo",
  "orgEmail": "org@example.com",
  "orgPhone": "+977-1-4444444",
  "orgAddress": "Kathmandu, Nepal",
  "orgWebsite": "https://example.com",
  "fiscalYearStart": "July",
  "currency": "NPR",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+977-9841000000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization and admin account created successfully. Please check your email to verify your account.",
  "data": {
    "organization": {
      "id": "org-abc123",
      "name": "My Organization",
      "type": "ngo"
    },
    "user": {
      "id": "user-xyz789",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    }
  }
}
```

#### POST /api/registration/user
Register a new user in existing organization.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "phone": "+977-9841000001",
  "role": "finance_officer",
  "organizationId": "org-001",
  "departmentId": "dept-001"
}
```

#### GET /api/registration/verify-email/:token
Verify user's email address.

**Parameters:**
- `token` (URL param): Email verification token

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST /api/registration/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/registration/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123"
}
```

---

### 💬 Messaging Endpoints

#### GET /api/messages
Get all messages for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-001",
      "subject": "Budget Approval",
      "body": "Please review the Q1 budget",
      "sender": {
        "id": "user-001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "recipient": {
        "id": "user-002",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "readAt": null,
      "createdAt": "2024-01-13T10:30:00Z"
    }
  ]
}
```

#### GET /api/messages/conversations
Get all conversations with unread counts.

#### GET /api/messages/thread/:userId
Get message thread with specific user.

**Parameters:**
- `userId` (URL param): ID of the other user

#### POST /api/messages
Send a new message.

**Request Body:**
```json
{
  "recipientId": "user-002",
  "subject": "Budget Approval",
  "body": "Please review the Q1 budget",
  "attachments": []
}
```

#### PUT /api/messages/:id/read
Mark message as read.

#### DELETE /api/messages/:id
Delete a message.

#### GET /api/messages/unread/count
Get unread message count.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 📊 Analytics Endpoints

#### GET /api/analytics/dashboard
Get comprehensive analytics dashboard.

**Query Parameters:**
- `fiscalYear` (optional): Filter by fiscal year
- `departmentId` (optional): Filter by department
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBudget": 5000000,
      "totalSpent": 1850000,
      "totalIncome": 1500000,
      "totalExpense": 1850000,
      "netIncome": -350000,
      "budgetUtilization": 37,
      "remaining": 3150000
    },
    "departments": [
      {
        "id": "dept-001",
        "name": "Finance",
        "totalBudget": 800000,
        "totalSpent": 450000,
        "utilization": 56.25
      }
    ],
    "trends": {
      "monthly": [
        {
          "month": "Aug 2024",
          "income": 300000,
          "expense": 350000,
          "net": -50000
        }
      ]
    },
    "distribution": {
      "budgetStatus": {
        "active": 4,
        "draft": 0,
        "completed": 0,
        "expired": 0
      },
      "transactionStatus": {
        "completed": 5,
        "pending": 1,
        "rejected": 0
      }
    },
    "alerts": {
      "overBudget": 0,
      "nearLimit": 1
    }
  }
}
```

#### GET /api/analytics/forecast
Get budget forecast and predictions.

**Query Parameters:**
- `budgetId` (required): Budget ID to forecast
- `months` (optional, default: 3): Number of months to forecast

**Response:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-001",
      "name": "Annual Budget 2024-25",
      "totalAmount": 5000000,
      "spentAmount": 1850000,
      "currentUtilization": 37
    },
    "historicalData": {
      "transactionCount": 15,
      "avgMonthlySpending": 308333,
      "totalPeriodMonths": 6
    },
    "forecast": [
      {
        "month": "Feb 2025",
        "predictedSpending": 320000,
        "cumulativeSpent": 2170000,
        "projectedUtilization": 43.4,
        "willExceed": false,
        "confidence": "high"
      }
    ],
    "predictions": {
      "exhaustionDate": "2026-05-15",
      "monthsRemaining": 16,
      "recommendedAction": "Budget is on track"
    }
  }
}
```

#### GET /api/analytics/spending-patterns
Analyze spending patterns.

**Query Parameters:**
- `departmentId` (optional): Filter by department
- `categoryId` (optional): Filter by category
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 25,
    "totalAmount": 1850000,
    "avgTransactionAmount": 74000,
    "dayOfWeek": [
      {
        "day": "Monday",
        "amount": 250000,
        "count": 5
      }
    ],
    "timeOfMonth": {
      "beginning": { "amount": 500000, "count": 8 },
      "middle": { "amount": 600000, "count": 9 },
      "end": { "amount": 750000, "count": 8 }
    },
    "amountDistribution": {
      "small": { "range": "0-10,000", "amount": 50000, "count": 8 },
      "medium": { "range": "10,000-50,000", "amount": 300000, "count": 10 },
      "large": { "range": "50,000-100,000", "amount": 500000, "count": 5 },
      "veryLarge": { "range": "100,000+", "amount": 1000000, "count": 2 }
    },
    "insights": [
      "Spending increases towards month-end",
      "High frequency of large transactions"
    ]
  }
}
```

#### GET /api/analytics/comparison
Compare departments or time periods.

**Query Parameters:**
- `type` (required): 'department' or 'period'
- `ids` (required): Comma-separated IDs

---

## 🎨 Feature Details

### 1. User Registration Flow

```
1. User fills registration form
   ↓
2. System creates user account (inactive)
   ↓
3. Email verification link sent
   ↓
4. User clicks verification link
   ↓
5. Email verified ✅
   ↓
6. Admin approves account (for non-org registrations)
   ↓
7. User can login ✅
```

### 2. Password Reset Flow

```
1. User clicks "Forgot Password"
   ↓
2. Enters email address
   ↓
3. Reset link sent to email
   ↓
4. User clicks reset link
   ↓
5. Enters new password
   ↓
6. Password updated ✅
   ↓
7. Confirmation email sent
```

### 3. Messaging Flow

```
1. User composes message
   ↓
2. Selects recipient
   ↓
3. Message sent
   ↓
4. Recipient receives notification
   ↓
5. Recipient reads message
   ↓
6. Read receipt sent
```

### 4. Budget Forecasting Algorithm

The forecasting system uses:
1. Historical transaction data (minimum 3 transactions)
2. Linear regression for trend analysis
3. Variance calculation for confidence levels
4. Time-series analysis for patterns

**Confidence Levels:**
- **High**: 10+ historical transactions
- **Medium**: 5-10 transactions
- **Low**: 3-5 transactions

---

## 🧪 Testing Guide

### Test 1: Organization Registration

```bash
curl -X POST http://localhost:5000/api/registration/organization \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "Test NGO",
    "orgType": "ngo",
    "orgEmail": "test@testngo.org",
    "firstName": "Test",
    "lastName": "Admin",
    "email": "admin@testngo.org",
    "password": "TestPass123"
  }'
```

### Test 2: Send Message

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipientId": "user-002",
    "subject": "Test Message",
    "body": "This is a test message"
  }'
```

### Test 3: Get Analytics

```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Get Forecast

```bash
curl "http://localhost:5000/api/analytics/forecast?budgetId=budget-001&months=6" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Usage Examples

### Example 1: Complete Registration Process

```javascript
// 1. Register organization
const registerOrg = await fetch('http://localhost:5000/api/registration/organization', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgName: 'Tech Solutions Nepal',
    orgType: 'sme',
    orgEmail: 'info@techsol.np',
    firstName: 'Ram',
    lastName: 'Bahadur',
    email: 'ram@techsol.np',
    password: 'SecurePass123'
  })
});

// 2. Check email (simulated - check console)
// 3. Verify email
const verifyEmail = await fetch(
  'http://localhost:5000/api/registration/verify-email/TOKEN_FROM_EMAIL'
);

// 4. Login
const login = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'ram@techsol.np',
    password: 'SecurePass123'
  })
});
```

### Example 2: Using Messaging System

```javascript
// Get conversations
const conversations = await fetch('http://localhost:5000/api/messages/conversations', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Send message
const sendMsg = await fetch('http://localhost:5000/api/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 'user-finance-001',
    subject: 'Budget Review',
    body: 'Please review Q1 budget allocation'
  })
});

// Get unread count
const unread = await fetch('http://localhost:5000/api/messages/unread/count', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Example 3: Analytics Dashboard

```javascript
// Get complete analytics
const analytics = await fetch(
  'http://localhost:5000/api/analytics/dashboard?fiscalYear=2024-25',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const data = await analytics.json();
console.log('Budget Utilization:', data.data.summary.budgetUtilization);
console.log('Departments:', data.data.departments);
console.log('Alerts:', data.data.alerts);
```

### Example 4: Budget Forecasting

```javascript
// Get 6-month forecast
const forecast = await fetch(
  'http://localhost:5000/api/analytics/forecast?budgetId=budget-001&months=6',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const forecastData = await forecast.json();
console.log('Predicted exhaustion:', forecastData.data.predictions.exhaustionDate);
console.log('Monthly forecasts:', forecastData.data.forecast);
```

---

## 🔐 Security Features

### 1. Email Verification
- Tokens expire after 24 hours
- One-time use tokens
- Secure random token generation

### 2. Password Reset
- Tokens expire after 1 hour
- One-time use tokens
- Confirmation email after reset

### 3. Authentication
- JWT tokens with expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control

### 4. Data Protection
- Sensitive data not exposed in APIs
- User passwords never returned
- Activity logging for audit trail

---

## 🚀 Migration Path to PostgreSQL

When you're ready to move from in-memory storage to PostgreSQL:

1. **Install pg package**
```bash
npm install pg
```

2. **Create database schema** (see schema in implementation guide)

3. **Update data store** to use PostgreSQL queries

4. **Migrate existing data**

5. **Update routes** to use async/await with database queries

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue 1: Email not being "sent"**
- **Solution**: Emails are simulated in console. Check backend terminal for email content.

**Issue 2: Forecast shows "Insufficient data"**
- **Solution**: Need at least 3 completed transactions for forecasting.

**Issue 3: Messages not appearing**
- **Solution**: Ensure both users are in same organization.

### Getting Help

1. Check backend console for error messages
2. Review API response error messages
3. Verify authentication token is valid
4. Check user permissions for the action

---

## 🎉 What's Next?

### Planned Features (Future)

1. File attachment support
2. Real email integration (SendGrid/AWS SES)
3. Two-factor authentication (2FA)
4. PDF report generation
5. Excel export functionality
6. Real-time notifications with WebSockets
7. Mobile app (React Native)
8. Multi-language support
9. Advanced security features
10. Automated backup system

---

## 📊 Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration | ✅ Complete | Email verification included |
| Password Reset | ✅ Complete | Token-based system |
| Internal Messaging | ✅ Complete | Full CRUD operations |
| Analytics Dashboard | ✅ Complete | Real-time metrics |
| Budget Forecasting | ✅ Complete | AI-based predictions |
| Spending Patterns | ✅ Complete | Multiple analysis types |
| Email Notifications | 🟡 Simulated | Console output only |
| File Uploads | ❌ Planned | Phase 2 |
| PDF Reports | ❌ Planned | Phase 2 |
| Excel Exports | ❌ Planned | Phase 2 |
| 2FA Authentication | ❌ Planned | Phase 3 |

---

## 📝 Version History

### Version 2.0.0 (Current)
- ✅ Added user registration system
- ✅ Added email verification
- ✅ Added password reset functionality
- ✅ Added internal messaging
- ✅ Added advanced analytics
- ✅ Added budget forecasting
- ✅ Added spending pattern analysis
- ✅ Enhanced security features

### Version 1.0.0
- Basic authentication
- Budget management
- Transaction tracking
- Department management
- Basic reporting
- Notification system

---

**Happy Budget Managing with Enhanced Features! 🎉📊💰**

For questions or issues, check the troubleshooting section or review the API documentation above.
