# BudMap — Full Bug Check Report
Date: April 2026

---

## 🔴 CRITICAL BUGS (will cause crashes or broken features)

### BUG 1 — Notifications route ordering conflict
**File:** `Backend/routes/notifications.js`
**Problem:** The route `PUT /read-all` is defined AFTER `PUT /:id/read`.
Express will match `PUT /read-all` as `PUT /:id` where id = "read-all", which means
marking all as read will never work — it will try to find a notification with _id of
"read-all" and always return 404.
**Fix:** Move the `/read-all` route BEFORE the `/:id/read` route.

### BUG 2 — AnalyticsPage.js uses wrong API key error message
**File:** `Frontend/pages/AnalyticsPage.js` lines ~100 and ~120
**Problem:** The error catch blocks say:
  "Make sure ANTHROPIC_API_KEY is set in .env"
But your project uses GEMINI_API_KEY, not ANTHROPIC_API_KEY.
This will confuse you during the viva if they ask about the AI setup.
**Fix:** Change the error message to say GEMINI_API_KEY.

### BUG 3 — MessagingPage.js calls non-existent endpoint
**File:** `Frontend/pages/MessagingPage.js` line ~loadUsers
**Problem:** The loadUsers() function calls `api.get('/users/colleagues')`.
This endpoint EXISTS in users.js ✅ — so this is actually fine.
(False alarm — marking as OK)

---

## 🟡 MEDIUM BUGS (broken behaviour, not crashes)

### BUG 4 — Admin settings route does nothing
**File:** `Backend/routes/admin.js` — GET/PUT /settings
**Problem:** Both settings routes are placeholders. GET always returns hardcoded
default settings. PUT /settings accepts any data but does not save it anywhere —
it just returns what was sent. If the viva panel tests settings, it will look broken.
**Status:** Known limitation — mention it as "planned for Phase 2".

### BUG 5 — User "delete" does not actually delete
**File:** `Backend/routes/users.js` — DELETE /:id
**Problem:** The delete route does NOT delete the user. It just sets isActive = false.
This is actually fine design (soft delete) but the response says
"User deactivated successfully" which is correct. However the route is mounted under
DELETE which implies permanent deletion. No actual bug — just a naming mismatch.
**Recommendation:** Be ready to explain "we use soft delete to preserve data integrity".

### BUG 6 — ReportsPage PDF export loads jsPDF from CDN
**File:** `Frontend/pages/ReportsPage.js` — loadPDFLibs()
**Problem:** PDF export loads jsPDF from cdnjs.cloudflare.com at runtime.
If there is no internet connection during the viva demo, PDF export will fail silently.
**Recommendation:** Test PDF export before your viva with internet on.

### BUG 7 — Dashboard.js Finance dashboard only fetches 5 pending transactions
**File:** `Frontend/pages/Dashboard.js` — FinanceDashboard useEffect
**Problem:** `transactionsAPI.getAll({ status: 'pending', limit: 5 })` — only
fetches 5 pending transactions for the approval list. If there are more than 5
pending, they won't appear in the dashboard (though they will show on TransactionsPage).
**Fix:** Increase limit to 10 or 20.

---

## 🟢 THINGS THAT LOOK LIKE BUGS BUT ARE FINE

### OK 1 — AnalyticsPage says "Powered by Claude" but uses Gemini
**File:** `Frontend/pages/AnalyticsPage.js`
The AI badge says "Powered by Claude" but the actual AI service uses Google Gemini.
This is just a label mismatch — easy to explain in viva.

### OK 2 — MessagingPage auto-polls every 15 seconds
This is intentional — `setInterval(loadConvos, 15000)` — refreshes conversations
every 15 seconds. Not a bug, it's a polling mechanism for near-real-time updates.

### OK 3 — No rate limiting on auth routes
Known security gap (noted in earlier report). Not a crash bug, just a security weakness.
Mention it as "planned improvement" in viva.

---

## ✅ FIXES TO APPLY NOW

Only 2 fixes needed right now — Bug 1 and Bug 2.
