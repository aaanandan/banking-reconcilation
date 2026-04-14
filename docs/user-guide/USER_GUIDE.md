# Banking Reconciliation Platform — User Guide

Document 9 · Version 1.0

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Upload & Reconciliation Tutorial](#2-upload--reconciliation-tutorial)
3. [Review Process Guide](#3-review-process-guide)
4. [Managing Your Account & Billing](#4-managing-your-account--billing)
5. [FAQ](#5-faq)

---

## 1. Getting Started

### 1.1 Creating Your Account

1. Navigate to your Banking Reconciliation Platform URL.
2. Click **Sign Up** on the login page.
3. Enter your company name, email address, and a strong password.
4. You will receive a welcome email — click **Verify Email** to activate your account.
5. You are now the **Tenant Admin** for your organisation.

### 1.2 Roles & Permissions

| Role | What They Can Do |
|------|-----------------|
| **Tenant Admin** | Full access: users, settings, billing, all reconciliations |
| **Accountant** | Create and review reconciliations; cannot manage users |
| **Viewer** | Read-only access to completed reconciliations |

### 1.3 Inviting Team Members

1. Go to **Settings → Users**.
2. Click **Invite User**.
3. Enter the user's email and select their role.
4. The user receives an invitation email with a one-time setup link.

### 1.4 Configuring Bank Accounts

1. Go to **Settings → Bank Accounts**.
2. Click **Add Bank Account**.
3. Enter the account name, bank name, and account number (last 4 digits).
4. Your plan determines how many accounts you can add (Free: 1, Starter: 3, Professional: 10).

---

## 2. Upload & Reconciliation Tutorial

### 2.1 Preparing Your Files

The platform accepts the following file formats:

| File Type | Accepted Formats |
|-----------|-----------------|
| Bank statement | CSV, XLSX, OFX, QFX |
| General ledger | CSV, XLSX |

**CSV column requirements (bank statement):**

```
Date, Description, Amount, Reference, Balance
2024-01-15, ACME PAYMENT, -1500.00, REF001, 48500.00
```

**CSV column requirements (ledger):**

```
Date, Account, Description, Debit, Credit, Reference
2024-01-15, 1001, Payment to ACME, 1500.00, , REF001
```

### 2.2 Starting a Reconciliation

1. Click **New Reconciliation** in the top navigation.
2. **Step 1 — Upload Files:**
   - Drag and drop your bank statement file(s) into the bank file zone.
   - Drag and drop your ledger/ERP export into the ledger file zone.
   - Click **Next**.
3. **Step 2 — Column Mapping:**
   - The system auto-detects column headers. Review and correct any mismatches.
   - Map: Date, Description, Amount/Debit/Credit, Reference.
   - Click **Next**.
4. **Step 3 — Date Range:**
   - Select the period to reconcile, or tick **Include All Dates**.
   - Click **Start Reconciliation**.

### 2.3 Understanding the Progress Screen

During processing you will see:

- **Total transactions** detected in both files
- **Matched** — transactions the system has automatically paired
- **Convergence rate** — percentage matched so far
- **Estimated time remaining**

You can leave this page; the reconciliation runs in the background. You will receive an email when it completes.

### 2.4 Matching Engine

The system uses a multi-pass matching strategy:

| Pass | Method | Example |
|------|--------|---------|
| 1 | Exact amount + date + reference | Perfect match |
| 2 | Exact amount + date (±1 day) | Timing difference |
| 3 | Exact amount + partial description | Truncated description |
| 4 | Fuzzy amount (±0.01) + date | Rounding differences |

---

## 3. Review Process Guide

### 3.1 Reviewing Results

After reconciliation completes:

1. Open the reconciliation from the **Dashboard**.
2. The **Summary Panel** shows:
   - Total transactions, matched count, unmatched count
   - Convergence rate (%)
   - Breakdown by match type
3. Use the tabs to switch between:
   - **Matched** — confirmed pairs
   - **Unmatched** — items needing attention
   - **Exceptions** — flagged for review

### 3.2 Handling Unmatched Items

For each unmatched transaction you can:

| Action | When to Use |
|--------|-------------|
| **Match manually** | You can identify the corresponding entry |
| **Create adjustment** | Genuine difference (bank charges, errors) |
| **Mark as exception** | Needs investigation by someone else |
| **Exclude** | Out-of-scope transaction (e.g., wrong period) |

### 3.3 Manual Matching

1. Click an unmatched bank transaction.
2. Click **Find Match**.
3. The system shows the most likely ledger candidates.
4. Select the correct ledger entry and click **Confirm Match**.

### 3.4 Exporting Results

1. Click **Export** at the top of the reconciliation.
2. Choose format:
   - **Excel (.xlsx)** — full detail with colour-coded matches
   - **CSV** — flat file for import into ERP
   - **PDF** — summary report for sign-off
3. The export includes matched pairs, unmatched items, and adjustments.

### 3.5 Sign-Off Workflow

1. When all items are resolved, click **Submit for Review**.
2. A Tenant Admin reviews and clicks **Approve**.
3. The reconciliation status changes to **Completed**.
4. A signed-off PDF is generated and stored.

---

## 4. Managing Your Account & Billing

### 4.1 Viewing Current Plan & Usage

Go to **Settings → Billing** to see:

- Your current plan (Free / Starter / Professional / Enterprise)
- Transactions used this month vs. quota
- Bank accounts used vs. limit
- Storage used vs. limit

### 4.2 Upgrading Your Plan

1. In **Settings → Billing**, click **Change Plan**.
2. Select the new plan.
3. Review the proration summary (you pay only for remaining days).
4. Click **Confirm Upgrade** — you are redirected to Stripe Checkout.
5. After payment, your new limits are active immediately.

### 4.3 Downgrading or Cancelling

- **Downgrade:** Select a lower plan. Access remains until the next billing cycle.
- **Cancel:** Click **Cancel Subscription**. You retain your current plan until period end, then revert to Free.

### 4.4 Invoices

All invoices are available in **Settings → Billing → Invoice History**. Each invoice links to a hosted Stripe page for download.

---

## 5. FAQ

**Q: How long does a reconciliation take?**
A: Typically under 2 minutes for files with fewer than 10,000 transactions. Larger files may take up to 10 minutes.

**Q: Can I reconcile multiple bank accounts at once?**
A: Yes — upload multiple bank statement files in Step 1. Each will be matched against the ledger independently.

**Q: What if my CSV columns are in a different order?**
A: The column mapping screen (Step 2 of the wizard) lets you re-map any column manually.

**Q: Is my data encrypted?**
A: Yes. Files are encrypted at rest (AES-256) and in transit (TLS 1.3). Files are deleted 90 days after the reconciliation is completed.

**Q: Can I pause a reconciliation in progress?**
A: Yes — click **Pause** on the progress screen. Resume at any time from the Dashboard.

**Q: What does "convergence rate" mean?**
A: It's the percentage of transactions that have been matched. A rate of 100% means every transaction has a confirmed pair.

**Q: How do I handle bank charges that don't appear in the ledger?**
A: Use **Create Adjustment** to log the bank charge. This adds it to the reconciliation without needing a ledger entry.

**Q: Can I give my auditor access?**
A: Yes — invite them as a **Viewer**. They can see all completed reconciliations but cannot create or modify anything.

**Q: What happens when I exceed my transaction quota?**
A: You will receive an email notification and new reconciliations will be blocked until you upgrade or the monthly counter resets.

**Q: How do I contact support?**
A: Email support@banking-recon.com. Professional plan users receive priority response within 4 business hours.

---

*For technical API documentation see [API Reference](../api/swagger-ui.html).*
*For admin documentation see [Admin Guide](ADMIN_GUIDE.md).*
