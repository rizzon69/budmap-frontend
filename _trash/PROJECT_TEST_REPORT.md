# BudMap – Full Project Test Report
Generated: April 2026 | Reviewed by: Code Analysis

---

## ✅ WORKING — Fully Implemented & Correct

### 🔐 Authentication
- JWT login/logout ✅
- Registration with email verification ✅
- Password hashing with bcrypt ✅
- Forgot password / Reset password ✅
- Google OAuth (passport-google-oauth20) ✅
- Role-based middleware (admin, finance_officer, department_head, viewer) ✅
- Token always reads role from live DB (not stale JWT payload) ✅

### 📦 Budget Management
- Create, read, update, delete budgets ✅
- Budget approval workflow (draft → active) ✅
- Budget allocations by category ✅
- Budget statistics/summary endpoint ✅
- Block deleting budgets that have transactions ✅

### 💳 Transactions
- Create/update/delete transactions ✅
- Multi-level approval (pending → completed) ✅
- Reject transactions ✅
- Auto-increments budget spentAmount on approval ✅
- Budget utilization alert email at 80%+ ✅
- Viewer role restricted to completed transactions only ✅

### 📊 Analytics
- Dashboard: totals, department breakdown, monthly trend ✅
- Budget forecasting (linear regression) ✅
- Spending patterns (day-of-week, time-of-month, amount ranges) ✅
- Department comparison ✅

### 💬 Messaging
- Send messages with file attachments (images, PDF, Word, MP4) ✅
- Conversations list ✅
- Message threads with auto-read-receipt ✅
- Unread count ✅
- Delete messages + auto-delete files from disk ✅
- In-app notification created on new message ✅

### 📋 Budget Approvals Workflow
- Department head submits budget request ✅
- Finance officer reviews (approve/reject/under_review) ✅
- Admin final-approves → creates real Budget record ✅
- Email notifications sent at each stage ✅

### 📈 Reports
- Financial report (income/expense/category/department breakdown) ✅
- Budget performance report ✅
- Department-wise report ✅
- Expense trends report ✅

### 📧 Email Service
- Beautiful HTML emails for all events ✅
- Graceful fallback to console.log when SMTP not configured ✅
- Gmail SMTP configured in .env ✅

### 🤖 AI Service (Gemini)
- Budget analysis via Google Gemini 2.0 Flash ✅
- Organization insights via Gemini ✅
- GEMINI_API_KEY configured in .env ✅

---

## ⚠️ ISSUES FOUND — Bugs & Problems

### 🔴 BUG 1: `req.user.id` vs `req.user.userId` mismatch (CRITICAL)
**File:** `Backend/routes/messages.js`
**Problem:** The auth middleware sets BOTH `req.user.userId` AND `req.user.id`.
But messages.js uses `req.user.id` for conversation lookups, which works.
However `budgetApprovals.js` references `req.user.firstName` and `req.user.lastName`
which are NOT set by the auth middleware at all.
**Line 133 in budgetApprovals.js:**
```js
userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
```
`req.user.firstName` is always undefined → comment author always shows as blank or email only.
**Fix needed:** Fetch user from DB when adding comments, or add firstName/lastName to req.user in middleware.

### 🔴 BUG 2: Password Reset Tokens Lost on Server Restart (CRITICAL)
**File:** `Backend/routes/auth.js` — line ~120
**Problem:** `passwordResetTokens` is stored in-memory as a plain JS object:
```js
const passwordResetTokens = {};
```
If the server restarts (which happens often in dev), all pending reset tokens are lost.
Users who requested a reset will get "Invalid or expired reset token" even with a valid link.
**Fix needed:** Store tokens in MongoDB (similar to EmailToken model which already exists).

### 🔴 BUG 3: Forecast Uses `Math.random()` — Non-Deterministic
**File:** `Backend/routes/analytics.js` — line ~forecast section
**Problem:**
```js
const variance = (Math.random() - 0.5) * 0.2;
```
Every time the forecast endpoint is called, results are different even with the same data.
This is bad for academic/financial reporting — forecasts should be consistent.
**Fix needed:** Remove random variance or use a seeded/deterministic calculation.

### 🟡 BUG 4: `userId` field in `req.user` is a string but compared with ObjectId
**File:** Multiple routes
**Problem:** `req.user.userId` is set as `.toString()` in middleware,
but some routes compare it with Mongoose ObjectId fields directly (e.g. `submittedBy`).
This can cause subtle mismatches in `.find({ submittedBy: req.user.userId })`.
**Fix needed:** Use `new mongoose.Types.ObjectId(req.user.userId)` when querying by userId.

### 🟡 BUG 5: `BudgetApproval` comment route — `req.user.email` not set
**File:** `Backend/routes/budgetApprovals.js` — review route line ~155
```js
userName: req.user.email
```
Auth middleware does set `req.user.email` ✅ — this one is fine.
But `req.user.firstName`/`lastName` in the comment route above is still broken (see BUG 1).

### 🟡 BUG 6: Email SMTP — App Password May Expire
**File:** `Backend/.env`
**Problem:** Gmail App Password is hardcoded. If the Gmail account's 2FA is changed
or the App Password is revoked, emails silently fail. There's no alert in the UI.
**Not a code bug but a deployment risk.**

### 🟡 BUG 7: Google OAuth Client Secret Exposed in .env
**File:** `Backend/.env`
**Problem:** `GOOGLE_CLIENT_SECRET` and `GEMINI_API_KEY` are committed in plain text.
If this repo is pushed to GitHub, these secrets will be exposed.
**Fix needed:** Add `.env` to `.gitignore` immediately.

---

## ❌ NOT IMPLEMENTED / MISSING

### Frontend Pages
| Page | Status | Notes |
|------|--------|-------|
| LandingPage | ✅ Exists | |
| LoginPage | ✅ Exists | |
| RegisterPage | ✅ Exists | |
| Dashboard | ✅ Exists | |
| BudgetsPage | ✅ Exists | |
| TransactionsPage | ✅ Exists | |
| ReportsPage | ✅ Exists | |
| AnalyticsPage | ✅ Exists | |
| MessagingPage | ✅ Exists | |
| AdminDashboard | ✅ Exists | |
| SettingsPage | ✅ Exists | |
| ComparisonPage | ✅ Exists | |
| BudgetApproval | ✅ Exists | |
| ActivityLogsPage | ✅ Exists | |
| PDF/Excel Export | ❌ MISSING | Planned but not built |
| Two-Factor Auth | ❌ MISSING | Planned but not built |
| WebSocket real-time | ❌ MISSING | Planned but not built |

### Backend
| Feature | Status |
|---------|--------|
| Activity Logs route | ⚠️ Model exists, no dedicated route found |
| Notifications route | ✅ Route exists |
| Admin route | ✅ Route exists |
| PDF report generation | ❌ Not implemented |
| Excel export | ❌ Not implemented |
| WebSocket / Socket.io | ❌ Not implemented |
| Rate limiting | ❌ Not implemented (security risk) |

---

## 🔒 Security Observations

| Check | Status |
|-------|--------|
| Passwords hashed with bcrypt | ✅ |
| JWT authentication on all protected routes | ✅ |
| Role-based access control | ✅ |
| Input validation on required fields | ✅ |
| Email enumeration prevention (forgot-password) | ✅ |
| .env secrets in version control | ⚠️ Risk if pushed to GitHub |
| No rate limiting on login/register | ⚠️ Brute force risk |
| No HTTPS enforced | ⚠️ Dev only, OK for now |
| File upload size limited (20MB) | ✅ |
| File type whitelist on uploads | ✅ |

---

## 📊 Overall Score

| Category | Score |
|----------|-------|
| Core Auth | 9/10 |
| Budget Management | 9/10 |
| Transactions | 10/10 |
| Analytics | 8/10 |
| Messaging | 10/10 |
| Reports | 9/10 |
| AI Integration | 8/10 |
| Email Service | 8/10 |
| Security | 7/10 |
| **Overall** | **8.7/10** |

---

## 🛠️ Recommended Fixes (Priority Order)

1. **[HIGH]** Fix `req.user.firstName/lastName` in budgetApprovals comment route
2. **[HIGH]** Move password reset tokens to MongoDB (use EmailToken model)
3. **[HIGH]** Add `.env` to `.gitignore` to protect secrets
4. **[MEDIUM]** Remove `Math.random()` from forecast for consistent results
5. **[MEDIUM]** Add rate limiting (express-rate-limit) to auth endpoints
6. **[LOW]** Add ObjectId casting when querying by req.user.userId in filters
