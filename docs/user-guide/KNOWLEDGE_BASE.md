# Knowledge Base

Banking Reconciliation Platform — Support Documentation

---

## 📚 Categories

- [Getting Started](#getting-started)
- [Reconciliation Process](#reconciliation-process)
- [File Formats & Uploads](#file-formats--uploads)
- [Matching & Review](#matching--review)
- [Billing & Plans](#billing--plans)
- [Account & Security](#account--security)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### How do I create an account?

1. Navigate to the platform URL
2. Click **Sign Up**
3. Enter your company name, email, and password
4. Verify your email via the link sent to your inbox
5. Log in with your credentials

You are automatically assigned the **Tenant Admin** role with full access to all features.

---

### What are the different user roles?

| Role | Permissions |
|------|------------|
| **Super Admin** | Platform-wide access (internal use only) |
| **Tenant Admin** | Full control: users, billing, settings, reconciliations |
| **Accountant** | Create and review reconciliations; cannot manage users or billing |
| **Viewer** | Read-only access to completed reconciliations |

---

### How do I invite team members?

1. Go to **Settings → Users**
2. Click **Invite User**
3. Enter email and select role (Accountant or Viewer)
4. User receives an invitation email with a setup link

Invited users create their own password during first login.

---

## Reconciliation Process

### What files do I need for a reconciliation?

You need:
1. **Bank statement** — one or more files from your bank (CSV, XLSX, OFX, QFX)
2. **General ledger export** — from your accounting system (CSV, XLSX)

Both files must cover the same time period.

---

### How long does a reconciliation take?

| Transaction Count | Typical Duration |
|------------------|-----------------|
| < 1,000 | Under 1 minute |
| 1,000 - 10,000 | 1-5 minutes |
| 10,000 - 50,000 | 5-15 minutes |
| 50,000+ | 15-30 minutes |

You can leave the page — the reconciliation runs in the background. You'll receive an email when complete.

---

### Can I pause a reconciliation?

Yes. Click **Pause** on the progress screen. Resume any time from the Dashboard by clicking the reconciliation and selecting **Resume**.

---

### What is convergence rate?

**Convergence rate** = (Matched transactions / Total transactions) × 100

A rate of 95%+ is typical for well-maintained records. Lower rates indicate:
- Missing transactions in one file
- Different date ranges between files
- Formatting inconsistencies

---

## File Formats & Uploads

### What file formats are supported?

| File Type | Supported Formats |
|-----------|------------------|
| Bank statement | CSV, XLSX, OFX, QFX, MT940 |
| General ledger | CSV, XLSX |

Maximum file size: **50 MB** (Free), **200 MB** (Starter), **500 MB** (Professional), **Unlimited** (Enterprise).

---

### What columns are required in my CSV?

**Bank statement minimum columns:**
- Date (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
- Description or Memo
- Amount (or separate Debit/Credit)

**Ledger minimum columns:**
- Date
- Description or Account Name
- Debit and Credit (or single Amount column)

The column mapping screen lets you select which columns to use.

---

### My CSV has non-English column headers. Will it work?

Yes. During column mapping (Step 2 of upload), manually map each column to the required field. The system supports any column names.

---

### Can I upload multiple bank accounts at once?

Yes. In Step 1, drag multiple bank statement files into the **Bank Files** zone. Each will be matched against the ledger independently.

Your plan determines the maximum number of bank accounts:
- Free: 1
- Starter: 3
- Professional: 10
- Enterprise: Unlimited

---

## Matching & Review

### How does the matching engine work?

The engine uses a **4-pass strategy**:

1. **Exact match** — Same amount, date, reference
2. **Near-date match** — Same amount and reference, date within ±1 day
3. **Fuzzy amount** — Date and reference match, amount differs by ≤$0.01 (rounding)
4. **Description similarity** — Amount and date match, description 80%+ similar

---

### What should I do with unmatched items?

| Scenario | Action |
|----------|--------|
| You can identify the matching entry | **Find Match** → select manually |
| Bank charge with no ledger entry | **Create Adjustment** |
| Needs investigation | **Mark as Exception** |
| Wrong period / out of scope | **Exclude** |

---

### How do I manually match two transactions?

1. Click an unmatched item
2. Click **Find Match**
3. System shows candidate matches ranked by confidence
4. Select the correct match and click **Confirm**

The pair moves to the **Matched** tab.

---

### Can I undo a manual match?

Yes. In the **Matched** tab, click the pair and select **Unmatch**. Both items return to the **Unmatched** tab.

---

## Billing & Plans

### What plans are available?

| Plan | Price | Transactions/mo | Bank Accounts | Storage |
|------|-------|----------------|---------------|---------|
| **Free** | $0 | 100 | 1 | 10 MB |
| **Starter** | $49/mo | 1,000 | 3 | 100 MB |
| **Professional** | $199/mo | 10,000 | 10 | 1 GB |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited |

---

### How do I upgrade my plan?

1. Go to **Settings → Billing**
2. Click **Change Plan**
3. Select the new plan
4. Review proration (you pay only for the remaining days in the current billing period)
5. Click **Confirm Upgrade** → redirected to Stripe Checkout
6. Complete payment

New limits are active immediately.

---

### What happens if I exceed my transaction quota?

You receive an email notification. New reconciliations are blocked until:
- You upgrade to a higher plan, OR
- The quota resets on the 1st of next month

Existing reconciliations remain accessible.

---

### Can I cancel my subscription?

Yes. Go to **Settings → Billing → Cancel Subscription**. You retain access until the end of your current billing period, then revert to the Free plan.

---

### How do I download invoices?

**Settings → Billing → Invoice History**. Click any invoice to view and download from Stripe.

---

## Account & Security

### How do I reset my password?

Click **Forgot Password** on the login page. Enter your email — you'll receive a reset link valid for 1 hour.

---

### Is my data encrypted?

Yes:
- **In transit:** TLS 1.3
- **At rest:** AES-256
- **Files:** Automatically deleted 90 days after reconciliation completion (configurable in Settings)

---

### Can I enable two-factor authentication (2FA)?

Not yet. 2FA is planned for Q2 2024. Subscribe to product updates in **Settings → Notifications**.

---

### Who can see my data?

Only users in your tenant (organisation). Data is isolated by tenant ID at the database level — cross-tenant access is architecturally impossible.

Super Admins (platform staff) have no access to tenant data without explicit consent (e.g., for support requests).

---

## Troubleshooting

### Upload fails with "Invalid file format"

**Cause:** File is corrupted, password-protected, or in an unsupported format.

**Solution:**
- Ensure file is CSV, XLSX, OFX, or QFX
- Remove password protection from Excel files
- Re-export from your source system

---

### Column mapping shows "Unable to detect columns"

**Cause:** CSV file has no header row, or headers are in row 2+.

**Solution:**
- Ensure the first row contains column names
- If data starts in row 1 with no headers, add a header row manually

---

### Reconciliation stuck at "Processing" for more than 30 minutes

**Cause:** Very large file (100k+ transactions) or system issue.

**Solution:**
1. Wait 10 more minutes — some large files take up to 45 minutes
2. If still stuck, click **Cancel** and retry
3. If issue persists, contact support with the reconciliation ID

---

### Convergence rate is unexpectedly low (<50%)

**Common causes:**
- Files cover different date ranges
- Currency mismatch (e.g., bank in USD, ledger in EUR)
- One file includes internal transfers excluded from the other

**Solution:**
- Verify both files cover the same period
- Check currency consistency in amount columns
- Review unmatched items for patterns

---

### Export fails with "No permission"

**Cause:** Your user role is Viewer (read-only).

**Solution:** Ask a Tenant Admin or Accountant to export on your behalf. Alternatively, request a role upgrade.

---

### I can't invite a new user

**Cause 1:** User limit reached for your plan (Free: 1, Starter: 5, Professional: 20).
**Solution:** Upgrade your plan or remove an inactive user.

**Cause 2:** Email already registered.
**Solution:** Check if the user already exists in **Settings → Users**.

---

### Billing shows "Payment failed"

**Cause:** Card declined, expired, or insufficient funds.

**Solution:**
1. Go to **Settings → Billing → Update Payment Method**
2. Add a new card
3. Retry payment from the Invoice History

Stripe retries automatically after 3, 5, and 7 days. After 3 failed attempts your account downgrades to Free.

---

*For issues not covered here, contact **support@banking-recon.com** or check the [User Guide](USER_GUIDE.md).*
