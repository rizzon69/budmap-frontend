const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@reazonkoirala.com.np';

// Dynamically resolve the correct frontend base URL.
// In production FRONTEND_URL is set to the hosted domain (e.g. https://budmap-frontend.vercel.app).
// Locally it falls back to localhost:3000 so dev emails still work.
const getBase = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const YEAR = new Date().getFullYear();

const fmt = (v) =>
  new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0 }).format(v || 0);

// ── shared HTML shell ────────────────────────────────────────────────────────
const shell = (headerColor, title, body) => {
  const BASE = getBase();
  return `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#f4f4f4;padding:0}
  .wrap{max-width:560px;margin:36px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.09)}
  .hdr{background:${headerColor};padding:32px;text-align:center}
  .hdr h1{color:#fff;font-size:26px;margin-bottom:4px}
  .hdr p{color:rgba(255,255,255,.85);font-size:14px}
  .bd{padding:28px 32px;color:#374151;line-height:1.7;font-size:14px}
  .bd h2{color:#111827;font-size:18px;margin-bottom:12px}
  .box{background:#f9fafb;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:13px}
  .box .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb}
  .box .row:last-child{border-bottom:none}
  .box .lbl{color:#6b7280}
  .box .val{font-weight:600;color:#111827}
  .btn{display:inline-block;background:${headerColor};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;font-size:14px;margin:12px 0}
  .badge-green{background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
  .badge-red{background:#fef2f2;color:#dc2626;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
  .badge-yellow{background:#fffbeb;color:#92400e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
  .alert-box{border-left:4px solid;border-radius:4px;padding:12px 16px;margin:16px 0;font-size:13px}
  .alert-warn{border-color:#f59e0b;background:#fffbeb;color:#92400e}
  .alert-danger{border-color:#dc2626;background:#fef2f2;color:#991b1b}
  .ftr{text-align:center;padding:18px 32px;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <h1>BudMap</h1>
    <p>${title}</p>
  </div>
  <div class="bd">${body}</div>
  <div class="ftr">
    &copy; ${YEAR} BudMap &middot; Budget Management System &middot; Nepal<br>
    <a href="${BASE}" style="color:#10b981;text-decoration:none">Open BudMap</a>
  </div>
</div></body></html>`;
};

// ── core send ────────────────────────────────────────────────────────────────
const send = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] RESEND_API_KEY not set — skipping: ${subject} → ${to}`);
    return { success: false };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `BudMap <${FROM}>`,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
    console.log(`[Email] Sent "${subject}" → ${to} (id: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error(`[Email] Failed "${subject}" → ${to}:`, err.message);
    return { success: false };
  }
};

// ── 1. Transaction Approved ──────────────────────────────────────────────────
const sendTransactionApproved = async (toEmail, firstName, tx) => {
  const BASE = getBase();
  const html = shell('#10b981', 'Transaction Approved', `
    <h2>Hi ${firstName},</h2>
    <p>Your transaction has been <span class="badge-green">Approved</span> and recorded.</p>
    <div class="box">
      <div class="row"><span class="lbl">Description</span><span class="val">${tx.description}</span></div>
      <div class="row"><span class="lbl">Amount</span><span class="val">${fmt(tx.amount)}</span></div>
      <div class="row"><span class="lbl">Type</span><span class="val">${tx.type}</span></div>
      <div class="row"><span class="lbl">Date</span><span class="val">${tx.date}</span></div>
      ${tx.reference ? `<div class="row"><span class="lbl">Reference</span><span class="val">${tx.reference}</span></div>` : ''}
    </div>
    <a href="${BASE}/transactions" class="btn">View Transactions</a>
  `);
  return send(toEmail, 'Transaction Approved — BudMap', html);
};

// ── 2. Transaction Rejected ──────────────────────────────────────────────────
const sendTransactionRejected = async (toEmail, firstName, tx) => {
  const BASE = getBase();
  const html = shell('#dc2626', 'Transaction Rejected', `
    <h2>Hi ${firstName},</h2>
    <p>Unfortunately your transaction has been <span class="badge-red">Rejected</span>.</p>
    <div class="box">
      <div class="row"><span class="lbl">Description</span><span class="val">${tx.description}</span></div>
      <div class="row"><span class="lbl">Amount</span><span class="val">${fmt(tx.amount)}</span></div>
      <div class="row"><span class="lbl">Date</span><span class="val">${tx.date}</span></div>
    </div>
    <p>Please contact your Finance Officer if you believe this is an error.</p>
    <a href="${BASE}/transactions" class="btn" style="background:#dc2626">View Transactions</a>
  `);
  return send(toEmail, 'Transaction Rejected — BudMap', html);
};

// ── 3. Budget Approved ───────────────────────────────────────────────────────
const sendBudgetApproved = async (toEmail, firstName, budget) => {
  const BASE = getBase();
  const html = shell('#10b981', 'Budget Approved', `
    <h2>Hi ${firstName},</h2>
    <p>Your budget request has been <span class="badge-green">Approved</span> and is now active.</p>
    <div class="box">
      <div class="row"><span class="lbl">Budget Name</span><span class="val">${budget.name}</span></div>
      <div class="row"><span class="lbl">Total Amount</span><span class="val">${fmt(budget.totalAmount)}</span></div>
      <div class="row"><span class="lbl">Fiscal Year</span><span class="val">${budget.fiscalYear}</span></div>
      <div class="row"><span class="lbl">Period</span><span class="val">${budget.startDate} → ${budget.endDate}</span></div>
      <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge-green">Active</span></span></div>
    </div>
    <a href="${BASE}/budgets" class="btn">View Budget</a>
  `);
  return send(toEmail, 'Budget Approved — BudMap', html);
};

// ── 4. Budget Alert ──────────────────────────────────────────────────────────
const sendBudgetAlert = async (toEmail, firstName, budget, utilizationPct) => {
  const BASE = getBase();
  const isOver     = utilizationPct >= 100;
  const color      = isOver ? '#dc2626' : '#f59e0b';
  const badgeClass = isOver ? 'badge-red' : 'badge-yellow';
  const label      = isOver ? 'Over Budget!' : 'Warning: High Usage';
  const alertClass = isOver ? 'alert-danger' : 'alert-warn';

  const html = shell(color, `Budget Alert — ${label}`, `
    <h2>Hi ${firstName},</h2>
    <p>Budget utilization alert for <strong>${budget.name}</strong>.</p>
    <div class="alert-box ${alertClass}">
      <strong>${utilizationPct.toFixed(1)}% of the budget has been used.</strong>
      ${isOver ? ' The budget has been exceeded.' : ' Consider reviewing spending.'}
    </div>
    <div class="box">
      <div class="row"><span class="lbl">Budget Name</span><span class="val">${budget.name}</span></div>
      <div class="row"><span class="lbl">Total Budget</span><span class="val">${fmt(budget.totalAmount)}</span></div>
      <div class="row"><span class="lbl">Amount Spent</span><span class="val">${fmt(budget.spentAmount)}</span></div>
      <div class="row"><span class="lbl">Remaining</span><span class="val">${fmt(budget.totalAmount - budget.spentAmount)}</span></div>
      <div class="row"><span class="lbl">Utilization</span><span class="val"><span class="${badgeClass}">${utilizationPct.toFixed(1)}%</span></span></div>
    </div>
    <a href="${BASE}/budgets" class="btn" style="background:${color}">View Budget</a>
  `);
  return send(toEmail, `Budget Alert: ${budget.name} — BudMap`, html);
};

// ── 5. Budget Request Notification ──────────────────────────────────────────
const sendBudgetRequestNotification = async (toEmail, reviewerName, request, submitterName) => {
  const BASE = getBase();
  const html = shell('#2563eb', 'New Budget Request Pending Review', `
    <h2>Hi ${reviewerName},</h2>
    <p>A new budget request requires your review.</p>
    <div class="box">
      <div class="row"><span class="lbl">Request Name</span><span class="val">${request.name}</span></div>
      <div class="row"><span class="lbl">Submitted By</span><span class="val">${submitterName}</span></div>
      <div class="row"><span class="lbl">Amount Requested</span><span class="val">${fmt(request.totalAmount)}</span></div>
      <div class="row"><span class="lbl">Fiscal Year</span><span class="val">${request.fiscalYear || '—'}</span></div>
      <div class="row"><span class="lbl">Period</span><span class="val">${request.startDate || '—'} → ${request.endDate || '—'}</span></div>
      <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge-yellow">Pending Review</span></span></div>
    </div>
    ${request.description ? `<p style="font-size:13px;color:#6b7280;margin-top:8px"><em>"${request.description}"</em></p>` : ''}
    <a href="${BASE}/budget-approvals" class="btn" style="background:#2563eb">Review Request</a>
  `);
  return send(toEmail, 'New Budget Request Pending — BudMap', html);
};

// ── Welcome ──────────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (toEmail, firstName) => {
  const BASE = getBase();
  const html = shell('#10b981', 'Welcome to BudMap', `
    <h2>Welcome, ${firstName}!</h2>
    <p>Your BudMap account has been created successfully. You are all set to start managing budgets smarter.</p>
    <div class="box">
      <div class="row"><span class="lbl">Real-time budget tracking</span><span class="val">Included</span></div>
      <div class="row"><span class="lbl">Role-based access control</span><span class="val">Included</span></div>
      <div class="row"><span class="lbl">Detailed financial reports</span><span class="val">Included</span></div>
      <div class="row"><span class="lbl">AI-powered forecasting</span><span class="val">Included</span></div>
    </div>
    <a href="${BASE}/dashboard" class="btn">Go to Dashboard</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af">If you did not create this account, please ignore this email.</p>
  `);
  return send(toEmail, 'Welcome to BudMap!', html);
};

// ── Password Reset ───────────────────────────────────────────────────────────
const sendPasswordResetEmail = async (toEmail, firstName, resetToken) => {
  const BASE = getBase();
  const link = `${BASE}/reset-password?token=${resetToken}`;
  const html = shell('#2563eb', 'Password Reset Request', `
    <h2>Hi ${firstName},</h2>
    <p>We received a request to reset your BudMap password. Click below to set a new password:</p>
    <a href="${link}" class="btn" style="background:#2563eb">Reset My Password</a>
    <div class="box" style="margin-top:16px;word-break:break-all;font-size:12px;font-family:monospace">${link}</div>
    <div class="alert-box alert-warn" style="margin-top:16px">This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.</div>
  `);
  return send(toEmail, 'Reset Your BudMap Password', html);
};

// ── Google Login ─────────────────────────────────────────────────────────────
const sendGoogleLoginEmail = async (toEmail, firstName) => {
  const BASE = getBase();
  const html = shell('#10b981', 'New Google Sign-in Detected', `
    <p>Hi <strong>${firstName}</strong>,</p>
    <div class="box">
      <div class="row"><span class="lbl">Method</span><span class="val">Google OAuth</span></div>
      <div class="row"><span class="lbl">Time</span><span class="val">${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</span></div>
    </div>
    <div class="alert-box alert-warn">If this was not you, contact your administrator immediately.</div>
  `);
  return send(toEmail, 'New Google Sign-in — BudMap', html);
};

// ── Email Verification ───────────────────────────────────────────────────────
const sendVerificationEmail = async (toEmail, firstName, verifyLink) => {
  const html = shell('#10b981', 'Verify Your Email Address', `
    <h2>Hi ${firstName},</h2>
    <p>Thanks for registering on BudMap! Please verify your email address to activate your account.</p>
    <a href="${verifyLink}" class="btn">Verify My Email</a>
    <div class="box" style="margin-top:16px;word-break:break-all;font-size:12px;font-family:monospace">${verifyLink}</div>
    <div class="alert-box alert-warn" style="margin-top:16px">This link expires in <strong>24 hours</strong>.</div>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af">If you did not create this account, please ignore this email.</p>
  `);
  return send(toEmail, 'Verify Your BudMap Email Address', html);
};

// ── Connection test ───────────────────────────────────────────────────────────
const testEmailConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — emails will be skipped');
    return false;
  }
  console.log(`[Email] Resend ready — sending from ${FROM}`);
  return true;
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendGoogleLoginEmail,
  sendTransactionApproved,
  sendTransactionRejected,
  sendBudgetApproved,
  sendBudgetAlert,
  sendBudgetRequestNotification,
  testEmailConnection,
};
