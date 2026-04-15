# Video Tutorial Scripts

Banking Reconciliation Platform · Document 9 (Video component)

---

## Tutorial 1: Getting Started (5 minutes)

**Target audience:** New users, Tenant Admins
**Goal:** Account setup, first login, invite a team member

---

### Script

**[INTRO — 0:00-0:20]**
*Screen: Platform login page*

> "Welcome to Banking Reconciliation Platform. In this tutorial we'll walk through creating your account, setting up your first bank account, and inviting a team member. This takes about five minutes."

---

**[SCENE 1 — 0:20-1:00] Sign Up**
*Screen: Sign Up form*

> "Click Sign Up. Enter your company name — this becomes your workspace name. Add your email address and a strong password, then click Create Account."
> "Check your email for the verification link. Click Verify Email to activate your account."

---

**[SCENE 2 — 1:00-2:00] Dashboard Overview**
*Screen: Dashboard after first login*

> "You're now on the Dashboard. The top bar shows your current plan and usage. The main area will list your reconciliations — it's empty now, we'll add one in Tutorial 2."
> "On the left: Dashboard, New Reconciliation, Settings."

---

**[SCENE 3 — 2:00-3:30] Add a Bank Account**
*Screen: Settings → Bank Accounts*

> "Go to Settings, then Bank Accounts. Click Add Bank Account."
> "Enter a friendly name — for example 'Main Checking'. Enter the bank name and the last four digits of the account number. Click Save."
> "Your account is now listed. You can add up to [N] accounts on your current plan."

---

**[SCENE 4 — 3:30-4:30] Invite a Team Member**
*Screen: Settings → Users → Invite*

> "Go to Settings, then Users. Click Invite User."
> "Enter your colleague's email. Choose their role — Accountant if they'll be doing reconciliations, Viewer for read-only access."
> "Click Send Invitation. They'll receive an email within a few minutes."

---

**[OUTRO — 4:30-5:00]**

> "That's it for getting started. In Tutorial 2 we'll upload your first bank statement and run a reconciliation. See you there."

---

---

## Tutorial 2: Running Your First Reconciliation (8 minutes)

**Target audience:** Accountants, Tenant Admins
**Goal:** Upload files, map columns, run reconciliation, review results

---

### Script

**[INTRO — 0:00-0:20]**

> "In this tutorial we'll upload a bank statement and ledger export, run the matching engine, and review the results."

---

**[SCENE 1 — 0:20-1:30] Prepare Files**
*Screen: File manager showing sample CSV files*

> "You need two files: your bank statement — we support CSV, Excel, OFX — and your general ledger export in CSV or Excel."
> "Make sure your bank statement has Date, Description, Amount, and ideally a Reference column. The system will guide you through mapping these in a moment."

---

**[SCENE 2 — 1:30-3:00] Upload**
*Screen: New Reconciliation wizard, Step 1*

> "Click New Reconciliation. Drag your bank statement into the Bank Files zone — you can add multiple bank accounts at once."
> "Then drag your ledger export into the Ledger File zone. Click Next."

---

**[SCENE 3 — 3:00-4:30] Column Mapping**
*Screen: Column mapping screen*

> "The system has detected your column headers. Review each mapping. Here it correctly identified Date, Description, and Amount."
> "If any column shows a warning, click the dropdown to select the correct column from your file."
> "Click Next when all columns are mapped."

---

**[SCENE 4 — 4:30-5:30] Date Range & Start**
*Screen: Date range step*

> "Select your reconciliation period. For a full-month reconciliation tick Include All Dates, or set a specific date range."
> "Click Start Reconciliation. The engine starts processing immediately."

---

**[SCENE 5 — 5:30-7:00] Review Results**
*Screen: Completed reconciliation results*

> "Processing is complete. The summary shows 94% convergence — 940 of 1000 transactions matched automatically."
> "The Matched tab shows confirmed pairs. Click any row to see the side-by-side detail."
> "The Unmatched tab shows 60 items needing attention. We'll handle those in Tutorial 3."

---

**[OUTRO — 7:00-8:00]**

> "You've run your first reconciliation. In Tutorial 3 we'll review and resolve the unmatched items and export the final report."

---

---

## Tutorial 3: Reviewing & Exporting (6 minutes)

**Target audience:** Accountants, Tenant Admins
**Goal:** Handle unmatched items, manual match, export, sign off

---

### Script

**[INTRO — 0:00-0:15]**

> "In this tutorial we'll resolve unmatched transactions, manually pair two entries, and export the completed reconciliation."

---

**[SCENE 1 — 0:15-1:30] Unmatched Items**
*Screen: Unmatched tab*

> "Click the Unmatched tab. Each row shows a transaction from either the bank or the ledger with no automatic match."
> "For this bank charge of $25, there's no corresponding ledger entry. Click the row, then Create Adjustment. Enter the description 'Monthly bank fee' and click Save."

---

**[SCENE 2 — 1:30-3:00] Manual Match**
*Screen: Manual match flow*

> "This $1,500 bank payment wasn't matched automatically because the reference numbers differ. Click Find Match."
> "The system shows the three most likely ledger candidates. This one shows 97% confidence — the amount and date match perfectly. Click Confirm Match."
> "The pair is now in the Matched tab."

---

**[SCENE 3 — 3:00-4:00] Export**
*Screen: Export dialog*

> "Once all items are resolved, click Export."
> "Choose Excel for a colour-coded workbook — green for matched, orange for adjustments."
> "Or choose PDF for a management-ready summary report. Click Download."

---

**[SCENE 4 — 4:00-5:00] Sign Off**
*Screen: Sign-off button*

> "Click Submit for Review. Your Tenant Admin receives a notification."
> "[Switch to admin view] As the admin, click Approve. The reconciliation is now Completed and locked. A signed PDF is generated automatically."

---

**[OUTRO — 5:00-6:00]**

> "Your reconciliation is complete. Check the Billing section to monitor your monthly usage, and refer to the FAQ in the User Guide for common questions. Thank you."

---

*These scripts are for screen-recording production. Estimated recording time per tutorial: 1.5× script length.*
