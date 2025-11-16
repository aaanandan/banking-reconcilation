# Test Data for Multi-Bank Reconciliation

## Overview

This directory contains sample CSV files for testing the complete multi-bank reconciliation flow.

**Scenario:** 3 banks (HDFC, ICICI, SBI) → 1 consolidated accounting ledger

---

## Files

### Bank Files (3)

1. **hdfc_bank_jan_2024.csv** (HDFC Bank)
   - Format: Date, Amount, Description, Transaction Type, Reference Number
   - Records: 7 transactions
   - Date format: DD/MM/YYYY

2. **icici_bank_jan_2024.csv** (ICICI Bank)
   - Format: Transaction Date, Debit, Credit, Narration, Cheque/Ref No
   - Records: 6 transactions
   - Amount split: Debit/Credit columns

3. **sbi_jan_2024.csv** (SBI)
   - Format: Txn Date, Particulars, Withdrawal, Deposit, Ref No
   - Records: 6 transactions
   - Amount split: Withdrawal/Deposit columns

### Ledger File (1)

4. **accounting_ledger_jan_2024.csv**
   - Format: Date, Particulars, Amount, Type, Account Code
   - Records: 12 transactions
   - Consolidated entries from all banks

---

## Expected Matching Results

### HDFC Bank → Ledger Matches

| HDFC Txn | Date | Amount | Description | Ledger Match | Expected |
|----------|------|--------|-------------|--------------|----------|
| 1 | 15/01/2024 | 5000.00 | Office Rent Payment | Ledger #1 | ✅ EXACT MATCH |
| 2 | 16/01/2024 | 1200.50 | Software License Fee | Ledger #2 | ✅ EXACT MATCH |
| 3 | 17/01/2024 | 750.00 | Internet Bill Payment | - | ❌ NO MATCH |
| 4 | 18/01/2024 | 25000.00 | Client Payment Received | Ledger #4 | ✅ EXACT MATCH |
| 5 | 20/01/2024 | 3500.00 | Equipment Purchase | Ledger #6 | ✅ EXACT MATCH |
| 6 | 22/01/2024 | 450.00 | Office Supplies | Ledger #8 | ✅ EXACT MATCH |
| 7 | 25/01/2024 | 12000.00 | Consulting Payment | Ledger #10 | ✅ EXACT MATCH |

**HDFC Match Rate:** 6/7 = **85.7%**

### ICICI Bank → Ledger Matches

| ICICI Txn | Date | Amount | Narration | Ledger Match | Expected |
|-----------|------|--------|-----------|--------------|----------|
| 1 | 15/01/2024 | 8000.00 | Vendor Payment - ABC Corp | Ledger #3 | ✅ EXACT MATCH |
| 2 | 19/01/2024 | 2500.00 | Marketing Expenses | - | ❌ NO MATCH |
| 3 | 21/01/2024 | 15000.00 | Sales Invoice Payment | Ledger #7 | ✅ EXACT MATCH |
| 4 | 23/01/2024 | 6000.00 | Contractor Payment | Ledger #9 | ✅ EXACT MATCH |
| 5 | 26/01/2024 | 800.00 | Stationary Purchase | - | ❌ NO MATCH |
| 6 | 28/01/2024 | 20000.00 | Project Advance Received | - | ❌ NO MATCH |

**ICICI Match Rate:** 3/6 = **50.0%**

### SBI → Ledger Matches

| SBI Txn | Date | Amount | Particulars | Ledger Match | Expected |
|---------|------|--------|-------------|--------------|----------|
| 1 | 16/01/2024 | 1500.00 | Electricity Bill | - | ❌ NO MATCH |
| 2 | 18/01/2024 | 45000.00 | Salary Credit | Ledger #5 | ✅ EXACT MATCH |
| 3 | 19/01/2024 | 10000.00 | Rent Collection | - | ❌ NO MATCH |
| 4 | 24/01/2024 | 5000.00 | Insurance Premium | - | ❌ NO MATCH |
| 5 | 27/01/2024 | 3200.00 | Travel Expenses | Ledger #11 | ✅ EXACT MATCH |
| 6 | 30/01/2024 | 8500.00 | Commission Received | Ledger #12 | ✅ EXACT MATCH |

**SBI Match Rate:** 3/6 = **50.0%**

---

## Overall Statistics

**Total Bank Transactions:** 19 (7 HDFC + 6 ICICI + 6 SBI)
**Total Ledger Transactions:** 12
**Expected Matches:** 12 (6 HDFC + 3 ICICI + 3 SBI)
**Expected Unmatched Bank:** 7
**Expected Unmatched Ledger:** 0 (all ledger entries should match)

**Overall Match Rate:** 12/19 = **63.2%**

---

## Data Prep Service Mapping

### HDFC Bank
```json
{
  "dateColumn": "Date",
  "amountColumn": "Amount",
  "descriptionColumn": "Description"
}
```

### ICICI Bank
```json
{
  "dateColumn": "Transaction Date",
  "amountColumn": "Debit|Credit",  // Merged columns
  "descriptionColumn": "Narration"
}
```

### SBI
```json
{
  "dateColumn": "Txn Date",
  "amountColumn": "Withdrawal|Deposit",  // Merged columns
  "descriptionColumn": "Particulars"
}
```

### Ledger
```json
{
  "dateColumn": "Date",
  "amountColumn": "Amount",
  "descriptionColumn": "Particulars"
}
```

---

## Testing Notes

1. **Different Date Formats:** All use DD/MM/YYYY, should be normalized to YYYY-MM-DD
2. **Different Column Names:** Tests per-bank column mapping
3. **Split Amount Columns:** ICICI and SBI have Debit/Credit or Withdrawal/Deposit
4. **Case Sensitivity:** Descriptions should match case-insensitively
5. **Unmatched Transactions:** 7 bank transactions intentionally have no ledger match

---

## Usage

```bash
# Upload to Data Prep Service
curl -X POST http://localhost:3001/data-prep/upload/bank \
  -F "file=@test-data/hdfc_bank_jan_2024.csv" \
  -F "bankId=bank_1" \
  -F "bankName=HDFC Bank"

# ... repeat for other banks and ledger

# Then proceed with reconciliation flow
```

---

**Created:** 2025-11-16
**Purpose:** End-to-end testing of multi-bank reconciliation system
