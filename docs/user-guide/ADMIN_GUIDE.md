# Administrator Guide

Banking Reconciliation Platform — Tenant Admin reference

---

## Table of Contents

1. [Tenant Administration](#tenant-administration)
2. [User Management](#user-management)
3. [Billing & Subscription Management](#billing--subscription-management)
4. [Settings & Configuration](#settings--configuration)
5. [Data Retention & Compliance](#data-retention--compliance)
6. [Monitoring & Audit](#monitoring--audit)
7. [Support & Escalation](#support--escalation)

---

## Tenant Administration

### What is a Tenant Admin?

As a **Tenant Admin**, you have full control over your organisation's workspace:

| Permission | Tenant Admin | Accountant | Viewer |
|-----------|-------------|-----------|--------|
| Create reconciliations | ✅ | ✅ | ❌ |
| Review & approve reconciliations | ✅ | ✅ | ❌ |
| Invite/remove users | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| Configure settings | ✅ | ❌ | ❌ |
| Delete tenant | ✅ | ❌ | ❌ |

---

### Tenant Settings Overview

Go to **Settings** to access:

- **General:** Tenant name, logo, timezone
- **Users:** Invite, manage roles, deactivate users
- **Bank Accounts:** Add/edit/remove linked accounts
- **Data Retention:** File deletion schedule
- **Notifications:** Email preferences for alerts
- **Billing:** Plan, usage, payment method, invoices
- **Audit Log:** User activity history (Professional/Enterprise)
- **API Keys:** Generate tokens for programmatic access (Professional/Enterprise)

---

## User Management

### Adding Users

1. Go to **Settings → Users**
2. Click **Invite User**
3. Enter:
   - **Email address**
   - **Role** (Accountant or Viewer)
   - **Optional:** First name, last name
4. Click **Send Invitation**

User receives an email with a setup link (valid for 7 days).

---

### User Roles Explained

**Accountant:**
- Create and run reconciliations
- Upload bank statements and ledger files
- Review matched/unmatched transactions
- Export results (Excel, PDF, CSV)
- Cannot invite other users or change billing

**Viewer (read-only):**
- View completed reconciliations
- Download exported reports
- Cannot create new reconciliations
- Cannot modify any data

**Use case:** Invite auditors or managers as Viewers for oversight without giving them edit access.

---

### Changing User Roles

1. **Settings → Users**
2. Click the user's name
3. Select new role from dropdown
4. Click **Save**

Changes take effect immediately. User is logged out and must re-login to refresh permissions.

---

### Deactivating Users

**When an employee leaves:**

1. **Settings → Users**
2. Click the user → **Deactivate**
3. Confirm

Deactivated users:
- Cannot log in
- Do not count toward your user quota
- Retain their historical activity in audit logs
- Can be reactivated later (click **Activate**)

**Deleting users permanently:**
- Only possible if the user has no associated reconciliations
- Deleting purges all audit trail — use **Deactivate** instead

---

### Resetting User Passwords

Users must reset their own passwords via **Forgot Password** on the login page.

Admins cannot see or reset user passwords directly (for security).

If a user is locked out:
1. Verify the account exists (**Settings → Users**)
2. Click **Resend Invitation** (resets password)
3. User receives a new setup link

---

## Billing & Subscription Management

### Viewing Current Plan & Usage

**Settings → Billing** shows:

- **Current Plan:** Free / Starter / Professional / Enterprise
- **Monthly Usage:**
  - Transactions this month: 342 / 1,000
  - Bank accounts: 2 / 3
  - Storage: 28 MB / 100 MB
  - Active users: 4 / 5
- **Next Billing Date:** When your card will be charged
- **Payment Method:** Last 4 digits of card on file

---

### Upgrading Your Plan

**When to upgrade:**
- Approaching transaction quota (80%+ used)
- Need more bank accounts
- Need API access (Professional+)
- Need priority support (Professional+)

**How to upgrade:**
1. **Settings → Billing → Change Plan**
2. Select new plan
3. Review proration:
   - You pay only for remaining days in the month
   - Example: Upgrade from Starter ($49) to Pro ($199) on Jan 15
   - Charge: $199 - ($49 × 16/31) = $173.68
4. Click **Confirm Upgrade** → Stripe Checkout
5. Complete payment

New limits are active **immediately** after payment.

---

### Downgrading Your Plan

**Important:** Downgrade takes effect at the **end of your current billing period**.

**Before downgrading:**
- Check if your current usage exceeds the new plan's limits
- Example: You have 8 bank accounts but downgrade to Starter (limit: 3)
- **Action required:** Delete 5 bank accounts before the downgrade date, or upgrade back

**How to downgrade:**
1. **Settings → Billing → Change Plan**
2. Select lower-tier plan
3. Review:
   - Current period end date
   - New limits that will apply
   - No refund for unused days
4. Click **Confirm Downgrade**

You retain current limits until period end.

---

### Handling Quota Overages

**Transactions quota exceeded:**
- You receive email at 80%, 90%, 100%
- At 100%: New reconciliations blocked
- **Solutions:**
  - Upgrade plan (instant)
  - Wait until 1st of next month (quota resets)

**Bank accounts quota exceeded:**
- Cannot add new accounts when at limit
- **Solution:** Delete unused accounts or upgrade

**Storage quota exceeded:**
- New uploads blocked
- **Solution:** Delete old reconciliations or shorten retention period (**Settings → Data Retention**)

---

### Managing Payment Methods

**To update your credit card:**
1. **Settings → Billing → Payment Method**
2. Click **Update Card**
3. Enter new card details → Stripe secure form
4. Click **Save**

Old card is removed immediately.

**Multiple cards:**
Not supported. Only one card can be on file at a time.

---

### Invoice History

**Settings → Billing → Invoices** shows:
- Invoice number
- Date
- Amount charged
- Status (Paid / Unpaid / Refunded)
- **Download PDF** link (hosted by Stripe)

Invoices are retained for 7 years for tax compliance.

---

### Cancelling Subscription

**Before cancelling:**
- Export any data you need (**Settings → Data Export**)
- Download invoices for your records
- Understand: Account reverts to **Free plan**, not deleted

**How to cancel:**
1. **Settings → Billing → Cancel Subscription**
2. Confirm by typing your email
3. You retain paid features until end of billing period
4. On renewal date: downgrade to Free automatically

**To delete your account entirely:** **Settings → Account → Delete Account** (irreversible).

---

## Settings & Configuration

### Tenant Settings

**Settings → General**

- **Tenant Name:** Displayed in UI header and emails
- **Logo:** Upload company logo (PNG/JPG, max 2MB, 200×200px recommended)
- **Timezone:** Used for date display and scheduled tasks
- **Date Format:** DD/MM/YYYY (UK), MM/DD/YYYY (US), or YYYY-MM-DD (ISO)

---

### Bank Accounts

**Settings → Bank Accounts**

Add all bank accounts you'll reconcile:
- **Account Name:** e.g., "Main Checking"
- **Bank Name:** e.g., "Wells Fargo"
- **Account Number (last 4 digits):** For record-keeping

**Limit by plan:**
- Free: 1
- Starter: 3
- Professional: 10
- Enterprise: Unlimited

**Deleting a bank account:**
- Only possible if no reconciliations reference it
- Otherwise: Archive instead (mark inactive)

---

### Data Retention

**Settings → Data Retention**

Configure how long uploaded files are stored:
- **30 days:** Minimum (compliance requirements)
- **90 days:** Default (recommended)
- **180 days:** Extended
- **1 year:** Maximum (Free/Starter)
- **7 years:** Enterprise only

Files are **automatically deleted** after the retention period. Reconciliation metadata (matched pairs, convergence rate) is retained indefinitely.

**Why delete files?**
- Reduces storage quota usage
- Reduces security risk (fewer files to protect)
- Compliance (some regulations require deletion after N days)

---

### Notification Settings

**Settings → Notifications**

Control which emails you receive:

| Event | Default |
|-------|---------|
| Reconciliation completed | ✅ On |
| Quota warning (80%) | ✅ On |
| Quota exceeded (100%) | ✅ On |
| Payment succeeded | ✅ On |
| Payment failed | ✅ On |
| New user invited | ⬜ Off |
| Weekly usage summary | ⬜ Off |
| Product updates | ⬜ Off |

All users can customize their own notifications. Admins cannot force notifications for other users.

---

## Data Retention & Compliance

### GDPR Compliance

As a Tenant Admin, you are the **Data Controller** for your organisation's data. The platform is the **Data Processor**.

**User rights you must support:**

1. **Right to Access:**
   - **Settings → Data Export → Export All Data**
   - Downloads JSON file with all reconciliations, users, audit logs

2. **Right to Deletion:**
   - **Settings → Account → Delete Account**
   - All data purged within 30 days

3. **Right to Rectification:**
   - Edit user names in **Settings → Users**
   - Edit bank account details in **Settings → Bank Accounts**

4. **Right to Portability:**
   - Export any reconciliation as Excel/CSV from the Dashboard

**DPA (Data Processing Agreement):**
- Standard DPA included in Terms of Service
- Custom DPA available for Enterprise customers

---

### SOC 2 Compliance

The platform is **SOC 2 Type II certified** (as of Jan 2024).

**For your audit:**
- Request the SOC 2 report: compliance@banking-recon.com
- Report is available under NDA for Professional/Enterprise customers
- Covers: Security, Availability, Confidentiality

**Audit logs** (**Settings → Audit Log**) provide evidence of:
- Who accessed data and when
- Changes to reconciliations
- User role changes
- Data exports

Logs are tamper-proof and retained for 7 years (Enterprise).

---

### Data Backup & Recovery

**Platform-level backups:**
- Database: Snapshots every 6 hours, retained for 30 days
- Files: S3 versioning enabled, 90-day retention
- Recovery Time Objective (RTO): <4 hours
- Recovery Point Objective (RPO): <6 hours

**Your responsibility:**
- Download critical reconciliation reports monthly (Excel/PDF)
- Store offline for disaster recovery

**To restore accidentally deleted reconciliations:**
- **Dashboard → Show Deleted → Restore** (within 30 days)
- After 30 days: Contact support@banking-recon.com (we may be able to restore from backup)

---

## Monitoring & Audit

### Audit Logs (Professional/Enterprise)

**Settings → Audit Log** tracks:

| Event Type | Example |
|------------|---------|
| Authentication | User logged in from 192.168.1.100 |
| Reconciliation | Created recon-456, Deleted recon-123 |
| User Management | Changed role: jane@acme.com → Accountant |
| Billing | Upgraded to Professional plan |
| Data Export | Exported recon-456 as Excel |
| Settings | Changed data retention to 180 days |

**Filters:**
- Date range
- User (who performed the action)
- Event type
- IP address

**Export:** Download CSV of audit log for external SIEM or compliance tools.

---

### Usage Analytics

**Dashboard → Usage** (Professional/Enterprise) shows:

- **Transactions by month:** Bar chart (last 12 months)
- **Top users:** Who runs the most reconciliations
- **Average convergence rate:** Quality metric over time
- **Files uploaded:** Count by month
- **Storage trend:** MB usage over time

Use this to:
- Forecast if you'll exceed quota next month
- Identify power users who need training
- Track convergence rate improvements

---

## Support & Escalation

### Support Tiers by Plan

| Plan | Channel | SLA | Hours |
|------|---------|-----|-------|
| Free | Community forum | Best effort | Business hours (9-5 ET) |
| Starter | Email: support@banking-recon.com | 24 hours | Business hours |
| Professional | Email: priority@banking-recon.com | 4 hours | 24/5 (Mon-Fri) |
| Enterprise | Dedicated Slack channel | 1 hour | 24/7 |

**Escalation path:**
1. Standard support (above)
2. If unresolved after 48 hours → escalations@banking-recon.com
3. Critical outages (all plans) → urgent@banking-recon.com

---

### When to Contact Support

**Self-service first:**
1. Check [Knowledge Base](KNOWLEDGE_BASE.md)
2. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
3. Check [FAQ](FAQ.md)

**Contact support if:**
- Error message says "Contact support with error code XYZ"
- Service is down (status.banking-recon.com shows outage)
- Reconciliation stuck in "Processing" for >2 hours
- Billing issue (charged incorrectly, payment failing)
- Security concern (unauthorized access suspected)

**Include in your support request:**
- **Account email**
- **Tenant name**
- **Reconciliation ID** (if applicable)
- **Error message** (screenshot or full text)
- **Steps to reproduce**

---

### Onboarding & Training

**Professional & Enterprise customers:**
- 1-hour onboarding call included (book from **Settings → Support**)
- We'll cover:
  - Best practices for file preparation
  - Column mapping templates
  - Review workflow
  - Billing and user management

**Enterprise customers:**
- Dedicated Customer Success Manager (CSM)
- Quarterly business reviews
- Unlimited training sessions

**For teams:**
Request white-glove onboarding for your entire finance team (up to 20 users): training@banking-recon.com

---

### Feature Requests

We track feature requests on our public roadmap: **roadmap.banking-recon.com**

**To submit a request:**
1. Check if it already exists (upvote instead)
2. Click **Submit Idea**
3. Describe the use case and business impact

Enterprise customers can request **custom features** via their CSM.

---

## Appendix: Admin Checklist

### Monthly Tasks

- [ ] Review usage (**Settings → Billing**) — are you approaching quota?
- [ ] Check audit log (**Settings → Audit Log**) — any suspicious activity?
- [ ] Download invoices for accounting records

### Quarterly Tasks

- [ ] Review user list (**Settings → Users**) — deactivate departed employees
- [ ] Review bank accounts (**Settings → Bank Accounts**) — remove closed accounts
- [ ] Export critical reconciliations as PDF for offline archive

### Annual Tasks

- [ ] Renew subscription (or switch to annual billing for 15% discount)
- [ ] Review compliance: GDPR, SOC 2 reports
- [ ] Evaluate upgrade to higher plan if usage growing

---

*For end-user documentation see [User Guide](USER_GUIDE.md).*
*For developer documentation see [API Examples](../api/API_EXAMPLES.md).*
