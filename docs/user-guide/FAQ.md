# Frequently Asked Questions (FAQ)

Banking Reconciliation Platform

---

## General

### What is banking reconciliation?

Banking reconciliation is the process of matching transactions from your bank statement with entries in your accounting ledger (ERP/general ledger) to ensure both records agree. Any differences are identified as errors, timing differences, or missing entries.

---

### Who is this platform for?

- **Accountants** who reconcile bank statements monthly or quarterly
- **Finance teams** in mid-to-large organisations handling multiple bank accounts
- **Auditors** who need transparent, documented reconciliation processes
- **Controllers** who want to automate repetitive manual matching tasks

---

### How does this save time compared to Excel?

| Task | Excel (manual) | Platform (automated) |
|------|---------------|---------------------|
| Matching 1,000 transactions | 2-4 hours | 2 minutes |
| Handling formatting differences | Manual cleanup | Auto-detected |
| Finding near-matches | Visual scanning | Fuzzy logic engine |
| Generating audit trail | Manual notes | Automatic PDF report |

Typical time savings: **90-95%** for routine reconciliations.

---

### Is this a replacement for my ERP system?

No. This platform **supplements** your ERP by automating the reconciliation process. You still export data from your ERP (QuickBooks, Xero, SAP, etc.) and upload it here for matching.

The platform generates a reconciliation report you can upload back to your ERP if needed.

---

## Technical

### What file formats are supported?

**Bank statements:**
- CSV (Comma-separated values)
- XLSX (Excel)
- OFX (Open Financial Exchange)
- QFX (Quicken)
- MT940 (SWIFT standard, coming Q2 2024)

**Ledger files:**
- CSV
- XLSX

Maximum file size varies by plan (Free: 50MB, Professional: 500MB, Enterprise: unlimited).

---

### Can I use this on mobile?

Yes. The web interface is fully responsive and works on tablets and phones. However, for large files (10k+ transactions) we recommend using a desktop browser for better performance.

A dedicated mobile app is planned for Q3 2024.

---

### Does the platform store my bank login credentials?

**No.** We never ask for or store your bank login. You manually download statements from your bank and upload them here. The platform does not connect to your bank directly.

---

### What happens to my files after a reconciliation?

Files are:
- **Encrypted at rest** (AES-256)
- **Automatically deleted** 90 days after the reconciliation is completed (configurable in Settings: 30/60/90/180 days)
- **Never shared** with third parties

You can manually delete files earlier from **Settings → Data Retention**.

---

### Is the platform GDPR compliant?

Yes. We comply with GDPR, CCPA, and SOC 2 Type II requirements:
- Data encryption (TLS 1.3 in transit, AES-256 at rest)
- Right to deletion (delete account → all data purged within 30 days)
- Data export (export all data as JSON from Settings)
- No sale of personal data

Our DPA (Data Processing Agreement) is available upon request for Enterprise customers.

---

## Reconciliation Process

### How accurate is the automatic matching?

The engine achieves **92-98% convergence** on typical datasets. Accuracy depends on:
- Data quality (consistent formatting, correct dates)
- Presence of unique reference numbers
- Similarity of descriptions between bank and ledger

Manual review handles the remaining 2-8%.

---

### What if my bank statement has no reference numbers?

The engine falls back to:
1. Exact amount + date matching
2. Fuzzy amount (±$0.01) + date ±1 day
3. Description similarity (80%+ match) + amount

Reference numbers improve accuracy but are not required.

---

### Can I reconcile multiple months at once?

Yes. Upload files covering any date range (e.g., Jan-Dec 2023) and the system processes all transactions. However, for large periods (12+ months) we recommend splitting into quarters for easier review.

---

### What is a "fuzzy match"?

A fuzzy match occurs when two transactions are **very similar but not identical**. Examples:

| Bank | Ledger | Match Type |
|------|--------|-----------|
| $1,234.56 on Jan 15 | $1,234.56 on Jan 16 | Date off by 1 day |
| $500.00 | $499.99 | Amount off by $0.01 (rounding) |
| "ACME CORP PAYMENT" | "ACME CORPORATION" | Description 85% similar |

Fuzzy matches are flagged for review — you confirm or reject each one.

---

### Can I exclude certain transactions?

Yes. In the review screen, select transactions and click **Exclude**. Common use cases:
- Internal transfers (appear in both files but don't need matching)
- Out-of-scope periods
- Duplicate entries

Excluded items are logged but not counted in the convergence rate.

---

## Billing & Plans

### Can I try the platform for free?

Yes. The **Free plan** includes:
- 1 bank account
- 100 transactions per month
- 10 MB storage
- All core features (matching, review, export)

No credit card required to start.

---

### What happens if I exceed my transaction quota?

You receive an email notification when you reach 80% and 100% of your quota. At 100%:
- New reconciliations are blocked
- Existing reconciliations remain accessible
- Historical reports can still be downloaded

To continue, either **upgrade your plan** or **wait until the 1st of next month** when quotas reset.

---

### How is "storage" calculated?

Storage = total size of all uploaded files (bank statements + ledger) across all reconciliations.

Files are automatically deleted after the retention period (default: 90 days), which frees up storage.

---

### Can I downgrade my plan mid-month?

Yes. Downgrade takes effect at the **end of your current billing period**. You continue to enjoy your current plan's limits until then.

Example:
- You're on Professional ($199/mo), billing date is the 15th
- You downgrade to Starter on Feb 10
- You keep Professional limits until Mar 15
- On Mar 15 you're charged $49 (Starter rate) and limits change

---

### Do you offer refunds?

- **Within 14 days of first subscription:** Full refund, no questions asked
- **After 14 days:** Pro-rated refunds for unused days if you cancel within the first billing cycle
- **Renewals:** No refunds after the renewal date

Contact support@banking-recon.com to request a refund.

---

### Is there a discount for annual billing?

Yes. Annual plans receive **15% off**:
- Starter: $499/year (saves $89)
- Professional: $2,030/year (saves $358)

Switch to annual billing in **Settings → Billing → Change Billing Cycle**.

---

## Security & Privacy

### Who can see my data?

Only users in **your tenant** (organisation). Data isolation is enforced at the database level using tenant IDs — it's architecturally impossible for Tenant A to access Tenant B's data.

Platform administrators have no access to tenant data without explicit consent (e.g., for support tickets).

---

### Do you have SOC 2 certification?

Yes. We are **SOC 2 Type II certified** as of January 2024. The report is available to Enterprise customers under NDA.

---

### How do you handle security vulnerabilities?

- **Bug bounty program** via HackerOne (report vulnerabilities at security@banking-recon.com)
- **Quarterly penetration testing** by third-party auditors
- **Automated dependency scanning** (Dependabot, Snyk)
- **Incident response plan** with <1 hour detection and <4 hour remediation SLA

Security advisories are published at status.banking-recon.com.

---

### Can I use two-factor authentication (2FA)?

Not yet. 2FA (TOTP and SMS) is planned for **Q2 2024**. Subscribe to product updates in **Settings → Notifications**.

Current security:
- Strong password requirements (12+ chars, mixed case, symbols)
- Account lockout after 5 failed login attempts
- Session timeout after 24 hours of inactivity

---

## Integrations

### Does this integrate with QuickBooks / Xero / SAP?

Not yet. Current workflow:
1. Export ledger from your ERP as CSV/Excel
2. Upload to the platform
3. Download reconciliation report (Excel/PDF)
4. Import/attach to your ERP

**Direct ERP integrations** (read ledger data via API) are planned for:
- QuickBooks Online (Q3 2024)
- Xero (Q3 2024)
- SAP S/4HANA (Q4 2024)

Join the waitlist in **Settings → Integrations**.

---

### Can I automate uploads via API?

Yes. Use the [API](../api/API_EXAMPLES.md) to programmatically:
- Upload files (`POST /reconciliations`)
- Check status (`GET /reconciliations/{id}`)
- Download results

Example:
```bash
curl -X POST https://api.banking-recon.com/v1/reconciliations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "bankFiles[]=@bank_statement.csv" \
  -F "ledgerFile=@ledger.xlsx"
```

API access requires **Professional** or **Enterprise** plan.

---

### Do you support Plaid for bank connections?

Not yet. Plaid integration (auto-download bank statements) is on the roadmap for **Q4 2024**.

---

## Support

### How do I contact support?

| Plan | Support Channel | Response Time |
|------|----------------|---------------|
| Free | Community forum | Best effort |
| Starter | Email (support@banking-recon.com) | 24-48 hours |
| Professional | Email + priority queue | 4 business hours |
| Enterprise | Dedicated Slack channel | 1 hour (24/7) |

For urgent issues (service outage), use **urgent@banking-recon.com** (all plans).

---

### Do you offer onboarding or training?

- **Free & Starter:** Self-service (User Guide, video tutorials, knowledge base)
- **Professional:** 1-hour onboarding call included
- **Enterprise:** Dedicated CSM (Customer Success Manager) + unlimited training sessions

Book onboarding from **Settings → Support**.

---

### Can you help me set up my first reconciliation?

Yes. Professional and Enterprise customers can request **white-glove setup**:
- We review your file formats
- Configure column mappings as templates
- Run your first reconciliation with you
- Answer any questions

Email support@banking-recon.com with subject "Setup Request".

---

### Where is the platform hosted?

**AWS (Amazon Web Services)** in the following regions:
- **US customers:** us-east-1 (Virginia)
- **EU customers:** eu-west-1 (Ireland)
- **APAC customers:** ap-southeast-1 (Singapore)

Your data is stored in the region closest to you. Enterprise customers can choose a specific region.

---

### What is your uptime SLA?

| Plan | SLA | Credits |
|------|-----|---------|
| Free | Best effort | None |
| Starter | Best effort | None |
| Professional | 99.5% | 10% monthly credit per 0.5% below target |
| Enterprise | 99.9% | 25% monthly credit per 0.1% below target |

Check current uptime at **status.banking-recon.com**.

---

## Troubleshooting

### Why is my upload failing?

Common causes:
1. **File too large** — Free: 50MB limit, Starter: 200MB
2. **Unsupported format** — Must be CSV, XLSX, OFX, or QFX
3. **File is password-protected** — Remove password in Excel before uploading
4. **Corrupted file** — Re-export from your source system

If the issue persists, email the file to support@banking-recon.com.

---

### Why is convergence rate so low (<50%)?

Check for:
- **Different date ranges** — Bank covers Jan 1-31, ledger covers Jan 15-Feb 15
- **Currency mismatch** — Bank in USD, ledger in EUR
- **Missing transactions** — One file is incomplete
- **Wrong file uploaded** — e.g., uploaded last month's ledger by mistake

Review the **Unmatched** tab for patterns (all bank entries missing? all ledger entries missing?).

---

### Can I re-run a reconciliation with different settings?

Yes. From the Dashboard:
1. Click the reconciliation
2. Click **Clone**
3. Upload the same files (or corrected versions)
4. Adjust date range or column mappings
5. Click **Start**

The original reconciliation remains unchanged.

---

*Still have questions? Contact [support@banking-recon.com](mailto:support@banking-recon.com) or check the [Knowledge Base](KNOWLEDGE_BASE.md).*
