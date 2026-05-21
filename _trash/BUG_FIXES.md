# BudMap – Bug Fix Summary
Fixed: April 2026

---

## ✅ BUG 1 FIXED — Comment author name was blank
**File:** `Backend/routes/budgetApprovals.js`
**Problem:** `req.user.firstName` and `req.user.lastName` are never set by the auth
middleware, so all budget approval comments showed a blank name.
**Fix:** Added `getUserFullName(userId)` helper that fetches the real name from
MongoDB by userId. Used in both the `/comment` route and the `/review` route.

---

## ✅ BUG 2 FIXED — Password reset tokens lost on server restart
**File:** `Backend/routes/auth.js`
**Problem:** Reset tokens were stored in a plain JS object (`const passwordResetTokens = {}`).
Every server restart wiped them — users with a valid reset link would get "Invalid token".
**Fix:** Tokens are now stored in MongoDB using the existing `EmailToken` model
(which already had `type: 'password_reset'` support). Tokens survive restarts,
are automatically cleaned up by MongoDB TTL index after 1 hour, and are deleted
immediately after use (one-time use).

---

## ✅ BUG 3 FIXED — Forecast gave different results every call (Math.random)
**File:** `Backend/routes/analytics.js`
**Problem:** The forecast used `Math.random()` to add variance to predictions,
making results non-deterministic and unreliable for financial reporting.
**Fix:** Replaced with proper **linear regression** (least-squares method) on
historical monthly spending data. Results are now fully deterministic and consistent —
the same data always produces the same forecast. Also added a `trend` field
('increasing', 'decreasing', 'stable') based on the regression slope.

---

## ✅ BUG 4 FIXED — ObjectId string/type mismatch in analytics queries
**File:** `Backend/routes/analytics.js`
**Problem:** `departmentId` and `categoryId` from query strings were passed directly
into MongoDB queries as plain strings. This can cause silent mismatches when
Mongoose expects ObjectId types.
**Fix:** Added `toObjId()` helper that safely casts strings to `mongoose.Types.ObjectId`.
Applied in `/spending-patterns` and `/comparison` routes.

---

## ✅ BUG 5 FIXED — Secrets exposed if pushed to GitHub
**File:** `.gitignore` (created)
**Problem:** No `.gitignore` existed, meaning `.env` files with Gmail App Password,
Google OAuth secrets, and Gemini API key could be accidentally committed.
**Fix:** Created `.gitignore` at project root that excludes all `.env` files,
`node_modules`, build output, uploaded user files, and OS/editor junk files.

---

## Files Changed
| File | Change |
|------|--------|
| `Backend/routes/budgetApprovals.js` | Bug 1: fetch real user name from DB for comments |
| `Backend/routes/auth.js` | Bug 2: password reset tokens stored in MongoDB |
| `Backend/routes/analytics.js` | Bug 3: linear regression forecast; Bug 4: ObjectId casting |
| `.gitignore` | Bug 5: protect .env secrets from version control |
