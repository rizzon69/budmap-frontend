/**
 * BudMap AI Service — Google Gemini (Free tier)
 * Uses the Gemini 1.5 Flash API to generate real AI financial insights.
 * No npm package needed — uses Node built-in https.
 */

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

/**
 * Call Google Gemini and return the text response.
 */
function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
      return reject(new Error('GEMINI_API_KEY not configured in .env'));
    }

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });

    const path = `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => { data += chunk; });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Gemini response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Strip any markdown fences Gemini might wrap around JSON
 */
function cleanJSON(raw) {
  return raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

const fmtNPR = v => `NPR ${Number(v || 0).toLocaleString('en-NP')}`;

/**
 * Generate AI budget analysis for a specific budget + its transactions.
 */
async function generateBudgetAnalysis({ budget, transactions, forecastMonths }) {
  const completedExpenses = transactions.filter(t => t.type === 'expense' && t.status === 'completed');
  const completedIncome   = transactions.filter(t => t.type === 'income'  && t.status === 'completed');
  const totalExpense = completedExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = completedIncome.reduce((s, t) => s + t.amount, 0);
  const utilization  = budget.totalAmount > 0
    ? ((budget.spentAmount / budget.totalAmount) * 100).toFixed(1) : 0;
  const remaining = budget.totalAmount - budget.spentAmount;

  const txSummary = completedExpenses.slice(-15).map(t =>
    `- ${t.date}: ${fmtNPR(t.amount)} | ${t.description} | Payee: ${t.payee || 'N/A'}`
  ).join('\n') || 'No completed expense transactions yet.';

  const prompt = `You are a professional financial analyst for BudMap, a budget management application used by NGOs, SMEs, and educational institutions in Nepal. Analyze the following budget data and respond ONLY with a valid JSON object — no explanation, no markdown, no code fences.

BUDGET DATA:
Name: ${budget.name}
Total Amount: ${fmtNPR(budget.totalAmount)}
Amount Spent: ${fmtNPR(budget.spentAmount)}
Remaining: ${fmtNPR(remaining)}
Utilization: ${utilization}%
Fiscal Year: ${budget.fiscalYear || 'N/A'}
Total Income: ${fmtNPR(totalIncome)}
Total Expense: ${fmtNPR(totalExpense)}
Transaction Count: ${transactions.length} (${completedExpenses.length} expenses, ${completedIncome.length} income)
Forecast Period: ${forecastMonths} months

RECENT EXPENSE TRANSACTIONS:
${txSummary}

Respond with ONLY this JSON (no extra text):
{
  "overallHealth": "good or warning or critical",
  "healthReason": "one sentence",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "spendingPattern": "brief description",
  "forecast": {
    "nextMonthEstimate": 0,
    "willExceedBudget": false,
    "projectedExhaustionMonths": null,
    "confidence": "high or medium or low"
  },
  "summary": "2-3 sentence executive summary"
}`;

  const raw = await callGemini(prompt);
  return JSON.parse(cleanJSON(raw));
}

/**
 * Generate AI insights for overall organization spending.
 */
async function generateOrganizationInsights({ summary, departments, monthlyTrend }) {
  const deptSummary = departments
    .filter(d => d.totalBudget > 0)
    .map(d => `- ${d.name}: Budget ${fmtNPR(d.totalBudget)}, Spent ${fmtNPR(d.totalSpent)}, Utilization ${(d.utilization || 0).toFixed(1)}%`)
    .join('\n') || 'No department data.';

  const trendSummary = monthlyTrend
    .map(m => `- ${m.month}: Income ${fmtNPR(m.income)}, Expense ${fmtNPR(m.expense)}, Net ${fmtNPR(m.income - m.expense)}`)
    .join('\n') || 'No trend data.';

  const prompt = `You are a professional financial analyst for BudMap, used by organizations in Nepal. Analyze the organization's financial overview and respond ONLY with a valid JSON object — no explanation, no markdown, no code fences.

FINANCIAL SUMMARY:
Total Budget: ${fmtNPR(summary.totalBudget)}
Total Spent: ${fmtNPR(summary.totalSpent)}
Total Income: ${fmtNPR(summary.totalIncome)}
Total Expense: ${fmtNPR(summary.totalExpense)}
Net Income: ${fmtNPR(summary.netIncome)}
Budget Utilization: ${(summary.budgetUtilization || 0).toFixed(1)}%
Remaining: ${fmtNPR(summary.remaining)}
Over-budget budgets: ${summary.overBudget || 0}
Near-limit budgets: ${summary.nearLimit || 0}

DEPARTMENT BREAKDOWN:
${deptSummary}

MONTHLY TREND (last 6 months):
${trendSummary}

Respond with ONLY this JSON (no extra text):
{
  "organizationHealth": "good or warning or critical",
  "topInsights": ["insight1", "insight2", "insight3", "insight4"],
  "alerts": ["alert1", "alert2"],
  "bestPerformingDept": "department name or null",
  "worstPerformingDept": "department name or null",
  "recommendations": ["rec1", "rec2", "rec3"],
  "executiveSummary": "3-4 sentence overview"
}`;

  const raw = await callGemini(prompt);
  return JSON.parse(cleanJSON(raw));
}

module.exports = { generateBudgetAnalysis, generateOrganizationInsights };
