# Troubleshooting Guide

Banking Reconciliation Platform — Common issues and solutions

---

## Table of Contents

1. [Login & Access Issues](#login--access-issues)
2. [File Upload Problems](#file-upload-problems)
3. [Reconciliation Errors](#reconciliation-errors)
4. [Low Matching Rates](#low-matching-rates)
5. [Export & Download Issues](#export--download-issues)
6. [Billing & Payment Problems](#billing--payment-problems)
7. [Performance & Timeouts](#performance--timeouts)
8. [Data & Security Concerns](#data--security-concerns)

---

## Login & Access Issues

### Cannot log in — "Invalid credentials"

**Symptoms:**
- Error message: "The email or password you entered is incorrect"
- Login button shows red error

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Wrong password | Click **Forgot Password** to reset |
| Email typo | Verify email address spelling |
| Account not verified | Check inbox for verification email (may be in spam) |
| Account locked | Wait 15 minutes after 5 failed attempts, then retry |
| Wrong tenant | Verify you're logging into the correct subdomain (e.g., acme.banking-recon.com) |

**Still stuck?**
Email support@banking-recon.com with your registered email address.

---

### "Session expired" after a few minutes

**Symptoms:**
- Logged out unexpectedly
- Every action requires re-login

**Causes:**
- Browser blocking cookies
- Incognito/private mode active
- Clock on your computer is wrong (breaks JWT validation)

**Solutions:**
1. **Check cookies:** Settings → Privacy → Allow cookies from banking-recon.com
2. **Exit private mode:** Use normal browser window
3. **Fix system clock:** Ensure date/time is correct (± 5 minutes from real time)

---

### Invitation link says "Expired"

**Cause:** Invitation links expire after 7 days.

**Solution:**
Ask the Tenant Admin to resend the invitation from **Settings → Users → Resend Invitation**.

---

## File Upload Problems

### Upload fails immediately — "Invalid file format"

**Symptoms:**
- Red error message as soon as file is selected
- Upload progress bar never starts

**Causes & Solutions:**

| Issue | Fix |
|-------|-----|
| Wrong file type | Must be CSV, XLSX, OFX, or QFX — not PDF, DOC, TXT |
| File is password-protected | Remove password in Excel: File → Info → Protect Workbook → Encrypt with Password → delete password |
| File is corrupted | Re-export from your bank or ERP |
| File extension mismatch | Rename `.xls` to `.xlsx` if Excel 2007+ |

**Advanced:** Open the file in a text editor. If you see binary gibberish instead of data, the file is corrupted.

---

### Upload bar stuck at 0% or 99%

**Symptoms:**
- Progress bar doesn't move for >2 minutes
- Page says "Uploading..." but nothing happens

**Causes:**
- Network interruption
- File size exceeds plan limit (Free: 50MB, Starter: 200MB, Pro: 500MB)
- Browser extension blocking uploads (e.g., ad blocker)

**Solutions:**
1. **Check file size:** Right-click file → Properties → Size
2. **Disable extensions:** Try in incognito mode or different browser
3. **Retry upload:** Refresh page and try again
4. **Split large files:** If >500MB, split into two periods (e.g., Jan-Jun, Jul-Dec)

---

### "No data found in file"

**Symptoms:**
- Upload succeeds but column mapping screen shows empty dropdown

**Causes:**
- File has no header row
- Data starts in row 10+ (e.g., Excel template with title rows)
- File is blank

**Solutions:**
1. **Open file in Excel:** Verify row 1 contains column headers (Date, Amount, Description)
2. **Delete extra rows:** Remove logo, title, or summary rows above the headers
3. **Re-export:** Download a fresh extract from your source system

---

## Reconciliation Errors

### "Processing failed" error

**Symptoms:**
- Reconciliation status changes to "Failed"
- Error message: "An error occurred during processing"

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Corrupted file | Re-upload files |
| Column mapping incorrect | Click **Edit Mapping** and verify Date/Amount columns are correct |
| Date format not recognized | Use ISO format (YYYY-MM-DD) or DD/MM/YYYY or MM/DD/YYYY |
| Non-numeric amounts | Remove currency symbols ($, €) and commas from amount column |

**Still failing?**
Download the error log from the reconciliation detail page and send it to support@banking-recon.com.

---

### Reconciliation stuck at "Processing" for >30 minutes

**Expected duration:**
- < 1,000 transactions: 1-2 minutes
- 1,000-10,000: 2-10 minutes
- 10,000-50,000: 10-30 minutes
- 50,000+: 30-60 minutes

**If genuinely stuck (>2× expected time):**
1. Check **Dashboard** — status may have updated but page didn't refresh
2. Refresh the browser
3. If still "Processing" after 2 hours, click **Cancel** and retry
4. Contact support with reconciliation ID

---

### Column mapping shows wrong columns

**Symptoms:**
- "Date" dropdown shows "Account Number" column
- "Amount" dropdown shows text fields

**Cause:** Auto-detection guessed incorrectly based on column names.

**Solution:**
Manually select the correct column for each field:
- **Date:** Column containing transaction dates
- **Amount:** Column with dollar values (or separate Debit/Credit columns)
- **Description:** Transaction memo or payee name
- **Reference:** Check number, invoice number, or unique ID (optional)

Click **Save Mapping** when done.

---

## Low Matching Rates

### Convergence rate < 50%

**Diagnosis steps:**

**1. Check date ranges:**
- Go to **Unmatched** tab
- Sort by date
- Do all bank transactions fall in Month A, but all ledger transactions in Month B?
- **Fix:** Upload files covering the same period

**2. Check currencies:**
- Are amounts in different currencies? (Bank: $1,500 USD, Ledger: €1,350 EUR)
- **Fix:** Convert one file to match the other's currency before upload

**3. Check for missing data:**
- Count rows in each file (open in Excel)
- If bank has 1,000 rows but ledger has 200, ledger is incomplete
- **Fix:** Re-export ledger for the full period

**4. Check transaction types:**
- Do unmatched items include internal transfers or duplicates?
- **Fix:** Exclude internal transfers (they appear in both files but shouldn't match)

---

### Many "near matches" in review

**Symptoms:**
- System flags 100+ pairs as "Possible match (85% confidence)"
- Manual review needed for each

**Common scenarios:**

| Bank Description | Ledger Description | Why Not Auto-Matched |
|-----------------|-------------------|---------------------|
| ACME CORP | ACME CORPORATION INC | Description differs >20% |
| $1,234.56 on Jan 15 | $1,234.56 on Jan 16 | Date off by >1 day (fuzzy match only allows ±1) |
| CHK #12345 | REF #12345 | Reference format differs |

**Solutions:**
- **Batch confirm:** Select all near-matches with >90% confidence and click **Confirm All**
- **Improve source data:** Ask your ERP admin to use consistent payee names
- **Use reference numbers:** If your bank statement includes check/invoice numbers, map the Reference column

---

### All transactions showing as unmatched

**Likely cause:** Column mapping is wrong.

**Diagnosis:**
1. Click **Edit Mapping**
2. Verify:
   - **Date** column contains actual dates (not account numbers)
   - **Amount** column contains numbers (not text descriptions)
3. Preview: Click **Show Sample Data** to see first 5 rows

**Common mistakes:**
- Mapping "Amount" to "Balance" column
- Mapping "Date" to "Transaction ID" column
- Mapping "Description" to "Account Number" column

---

## Export & Download Issues

### Export button is greyed out

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Your role is Viewer | Ask an Accountant or Admin to export for you |
| Reconciliation still processing | Wait until status is "Completed" or "Paused" |
| Browser permissions | Allow downloads in browser settings |

---

### Downloaded Excel file is blank

**Symptoms:**
- File downloads successfully
- Opening in Excel shows empty cells

**Causes:**
- Excel version too old (pre-2007)
- File corrupted during download

**Solutions:**
1. **Update Excel:** Use Excel 2010 or newer, or try Google Sheets / LibreOffice
2. **Re-download:** Try again — download may have been interrupted
3. **Try CSV instead:** Click Export → CSV format

---

### PDF export shows garbled text

**Cause:** Font rendering issue in your PDF viewer.

**Solutions:**
1. **Try different viewer:** Adobe Reader, Chrome, Firefox
2. **Re-export:** Sometimes a fresh export fixes rendering
3. **Use Excel export:** Generate Excel → print to PDF from Excel

---

## Billing & Payment Problems

### Payment fails with "Card declined"

**Causes & Solutions:**

| Decline Reason | Solution |
|---------------|----------|
| Insufficient funds | Add funds to account or try different card |
| Card expired | Update expiration date in **Settings → Billing → Payment Method** |
| 3D Secure failed | Complete authentication in your bank's app, then retry |
| Card doesn't support international payments | Use a different card or enable international transactions |

**Still failing?**
Try a different card or contact your bank. Stripe error code will appear in the failure message — send it to support@banking-recon.com.

---

### Upgraded plan but limits didn't change

**Symptoms:**
- Paid for Professional but still shows "2/3 bank accounts"
- Transaction quota still shows Starter limits

**Cause:** Browser cache showing old data.

**Solutions:**
1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Log out and back in:** Forces data refresh
3. **Wait 5 minutes:** Changes propagate immediately but UI may lag slightly

If still wrong after 10 minutes, email support@banking-recon.com with your subscription ID.

---

### Cancelled subscription but still charged

**Cause:** Cancellation processed after the renewal date.

**Example timeline:**
- Renewal date: Jan 15
- You cancelled: Jan 16
- You were charged on Jan 15 (before cancellation)

**Solution:**
Cancellations take effect at the **end of the current period**. You'll receive service until then, then revert to Free.

If charged in error, contact support@banking-recon.com with:
- Transaction date
- Amount charged
- Cancellation confirmation email

We'll process a refund within 3-5 business days.

---

## Performance & Timeouts

### Page loading very slowly

**Symptoms:**
- Dashboard takes >10 seconds to load
- UI freezes when clicking reconciliations

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Slow internet | Test speed at speedtest.net — need ≥5 Mbps |
| Browser cache full | Clear cache: Settings → Privacy → Clear browsing data |
| Too many browser tabs | Close unused tabs (limit to <20 active) |
| Old browser version | Update to latest Chrome, Firefox, or Edge |

---

### Reconciliation times out

**Symptoms:**
- After 10-15 minutes: "Request timeout" error
- Reconciliation status: "Failed"

**Cause:** File is extremely large (100k+ transactions).

**Solutions:**
1. **Split into smaller periods:** Process Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec separately
2. **Upgrade to Professional or Enterprise:** Higher processing limits and priority queue
3. **Pre-filter data:** Remove out-of-scope transactions before upload

Enterprise customers can request extended timeout limits (up to 2 hours).

---

## Data & Security Concerns

### Can other tenants see my data?

**No.** Data isolation is enforced at multiple levels:
- Database: Every query includes `WHERE tenantId = 'your-tenant-id'`
- API: JWT token contains tenant ID — requests for other tenant IDs return 403 Forbidden
- File storage: Files saved to tenant-specific S3 buckets with IAM restrictions

Cross-tenant access is architecturally impossible.

---

### I accidentally deleted a reconciliation. Can I recover it?

**Soft delete period:** 30 days

**Recovery steps:**
1. Go to **Dashboard**
2. Click **Show Deleted** at the bottom
3. Find the reconciliation
4. Click **Restore**

After 30 days, deleted reconciliations are permanently purged and cannot be recovered.

---

### How do I delete all my data permanently?

1. Go to **Settings → Account**
2. Click **Delete Account**
3. Confirm by typing your email
4. All data (users, reconciliations, files, billing history) is purged within 30 days

This cannot be undone. Export your data first from **Settings → Data Export** if needed.

---

### Can I audit who accessed my reconciliations?

**Professional & Enterprise:** Yes. Go to **Settings → Audit Log** to see:
- Who logged in and when
- Who created/edited/deleted reconciliations
- Who exported data
- IP addresses and browser fingerprints

Audit logs are retained for 2 years (Professional) or 7 years (Enterprise).

**Free & Starter:** Audit logs not available. Upgrade to Professional for compliance tracking.

---

## Still Need Help?

### Before contacting support, gather:

1. **Your account email**
2. **Reconciliation ID** (if applicable) — found in the URL: `/reconciliations/recon-456`
3. **Error message** (screenshot or full text)
4. **Steps to reproduce** — what you clicked before the error occurred
5. **Browser & OS** — e.g., Chrome 120 on Windows 11

### Contact methods:

| Plan | Email | Response Time |
|------|-------|--------------|
| Free | support@banking-recon.com | 24-48 hours |
| Starter | support@banking-recon.com | 12-24 hours |
| Professional | priority@banking-recon.com | 4 business hours |
| Enterprise | Dedicated Slack channel | 1 hour (24/7) |

For service outages affecting all users: **urgent@banking-recon.com** (all plans, <1 hour response).

---

*For additional help see [User Guide](USER_GUIDE.md), [Knowledge Base](KNOWLEDGE_BASE.md), or [FAQ](FAQ.md).*
