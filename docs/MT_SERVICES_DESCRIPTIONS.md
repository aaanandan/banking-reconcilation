# MT-03 TO MT-16 - MATCHING SERVICE DESCRIPTIONS

## Brief Purpose & Logic for Each Matching Service

---

## 🎯 CRITICAL UNDERSTANDING

### **MT-01 & MT-02 vs MT-03 to MT-16**

**MT-01 & MT-02: MAIN MATCHING** (Find pairs)
- Purpose: Match bank transactions TO ledger transactions
- Find transactions that SHOULD have a counterpart
- Result: Bank ↔ Ledger pairs

**MT-03 to MT-16: EXCEPTION HANDLERS** (Reduce unknowns)
- Purpose: Classify transactions that WON'T have matches
- Run AFTER MT-01 & MT-02 on remaining unmatched transactions
- Identify WHY a transaction has no match
- Result: "Unknown" reduced by identifying special cases

### **The Problem:**

After MT-01 & MT-02, you have unmatched transactions:
```
100 unmatched bank transactions
- Are they errors?
- Missing ledger entries?
- Special cases?
- User must review ALL 100 ❌
```

### **The Solution:**

MT-03 to MT-16 classify these by type:
```
100 unmatched bank transactions

MT-03: 15 are bank fees (no ledger entry expected) ✓
MT-04: 3 are interest (no ledger entry expected) ✓
MT-07: 5 are duplicates (ignore) ✓
MT-08: 4 are reversals (self-cancelling pairs) ✓
MT-09: 8 are timing issues (match next month) ✓
MT-11: 2 are rounding differences (acceptable) ✓

Remaining: 63 → User reviews only these ✓
```

### **Key Principle:**
- If MT-02 CAN match it, MT-02 will
- MT-03+ only handle what MT-02 CAN'T match
- Goal: Give every unmatched transaction a REASON

---

## 📋 MATCHING SERVICES SUMMARY

| Service | Name | Purpose | Type |
|---------|------|---------|------|
| MT-01 | Exact Match | Match bank ↔ ledger (exact) | Matcher |
| MT-02 | Near-Exact | Match bank ↔ ledger (fuzzy) | Matcher |
| MT-03 | Bank Fees & Charges | Identify fees with no ledger | Classifier |
| MT-04 | Interest Credits | Identify interest with no ledger | Classifier |
| MT-05 | Split Payments | Handle 1 ledger ← N bank | Matcher |
| MT-06 | Consolidated Deposits | Handle 1 ledger ← N banks | Matcher |
| MT-07 | Duplicate Postings | Identify duplicates to ignore | Classifier |
| MT-08 | Reversals & Corrections | Identify self-cancelling pairs | Classifier |
| MT-09 | Timing Differences | Flag for next period matching | Classifier |
| MT-10 | Currency Conversion | Match with FX conversion | Matcher |
| MT-11 | Rounding Differences | Accept minor variances | Classifier |
| MT-12 | High-Volume Payer | Aggregate matching | Matcher |
| MT-13 | Standing Orders | Recurring pattern matching | Matcher |
| MT-14 | Unmatched Pool | Organize remaining unknowns | Organizer |
| MT-15 | Manual Classification | User-assisted | Manual |
| MT-16 | Final Validation | Safety checks | Validator |

---

## MT-03: BANK FEES & CHARGES (Exception Handler)

### **Purpose:**
Identify bank transactions that are fees/charges **with NO ledger entry expected**.
These won't match because they're bank-only transactions.

### **Scenario:**
```
Bank:    "Account maintenance fee" -$25
Ledger:  (no entry)

This is NORMAL - bank fees don't always appear in ledger.
MT-03 identifies and marks this as "bank_fee" so it's not "unknown".
```

### **Logic:**
1. **Run AFTER MT-01 & MT-02** on unmatched bank transactions
2. Detect fee keywords: fee, charge, maintenance, service, ATM, wire, etc.
3. Check amount is typical for fees ($5-$100 usually)
4. Mark as: `status: 'classified'`, `type: 'bank_fee'`
5. **Do NOT try to match to ledger**

### **Result:**
- Transaction removed from "unknown" pool
- User sees: "Bank fee - $25 (automatically classified)"
- Reduces manual review workload

### **Special Handling:**
- If fee HAS a ledger match, MT-02 already handled it
- MT-03 only processes genuinely unmatched fees

---

## MT-04: INTEREST CREDITS (Exception Handler)

### **Purpose:**
Identify bank interest transactions **with NO ledger entry expected**.
Interest may not be posted to ledger immediately.

### **Scenario:**
```
Bank:    "Interest earned - Jan"  +$12.50
Ledger:  (no entry)

This is NORMAL - interest might be recorded quarterly in ledger.
MT-04 identifies and marks this as "interest_income" so it's not "unknown".
```

### **Logic:**
1. **Run AFTER MT-01 & MT-02** on unmatched bank transactions
2. Detect interest keywords: interest, earnings, accrual, yield
3. Check it's a credit transaction (positive amount)
4. Check amount is typical for interest (usually < $1000)
5. Mark as: `status: 'classified'`, `type: 'interest_income'`

### **Result:**
- Transaction removed from "unknown" pool
- User sees: "Interest income - $12.50 (automatically classified)"
- Can be aggregated for monthly/quarterly reporting

### **Special Handling:**
- If interest HAS a ledger match, MT-02 already handled it
- MT-04 only processes genuinely unmatched interest

---

## MT-05: SPLIT PAYMENTS ⭐ Important

### **Purpose:**
Match multiple bank transactions to a single ledger entry.

### **Scenario:**
```
Bank 1:  Payment to ABC Corp  $500
Bank 2:  Payment to ABC Corp  $500
Ledger:  ABC Corp - Invoice   $1,000

Sum of bank txns = ledger amount
```

### **Logic:**
1. Group bank transactions by:
   - Same or similar description
   - Same date ±1 day
   - Same payer/entity
2. Check if sum equals ledger amount (±1% tolerance)
3. Return as consolidated match
4. User approves/rejects the group

### **Complexity:**
- Can be 2, 3, or more bank transactions
- May need to try different combinations
- Limit to max 5 transactions per group

---

## MT-06: CONSOLIDATED DEPOSITS ⭐ Important

### **Purpose:**
Multiple bank deposits (different branches/accounts) → one ledger entry.

### **Scenario:**
```
Bank_HDFC:  Cash deposit  $2,000
Bank_ICICI: Cash deposit  $3,000
Bank_SBI:   Cash deposit  $5,000
Ledger:     Total deposits $10,000

Multi-bank consolidation
```

### **Logic:**
1. Similar to MT-05 but **across multiple banks**
2. Group by:
   - Deposit keywords (cash, deposit, transfer in)
   - Same date
   - Sum matches ledger
3. **Uses bankId to track source**
4. Common in multi-bank scenarios

### **Multi-Bank Support:**
- Essential for companies with multiple bank accounts
- Tracks which bank contributed what amount
- User sees: "3 deposits from 3 banks → 1 ledger"

---

## MT-07: DUPLICATE POSTINGS (Exception Handler)

### **Purpose:**
Identify duplicate bank transactions **that should be ignored**.
Banking systems sometimes post the same transaction twice.

### **Scenario:**
```
Bank #1:  Payment to XYZ  $1,000  Jan 15
Bank #2:  Payment to XYZ  $1,000  Jan 15  (exact duplicate)
Ledger:   XYZ Payment     $1,000  Jan 15  (only one entry)

Bank #1 matched by MT-02.
Bank #2 identified as duplicate by MT-07 → mark as "duplicate", ignore.
```

### **Logic:**
1. **Run AFTER MT-01 & MT-02** on unmatched bank transactions
2. Find exact duplicates within same bank:
   - Same date
   - Same amount
   - Same/similar description
   - Within 24 hours
3. Mark as: `status: 'classified'`, `type: 'duplicate'`
4. Flag for user review (may be legitimate repeat transaction)

### **Result:**
- Duplicate removed from "unknown" pool
- User sees: "Possible duplicate transaction (review if needed)"
- Reduces confusion about "missing" ledger entries

### **Special Handling:**
- Don't auto-delete - user should confirm
- If both duplicates unmatched, flag both for review

---

## MT-08: REVERSALS & CORRECTIONS (Exception Handler)

### **Purpose:**
Identify bank reversals/corrections that **cancel each other out**.
These pairs net to zero and don't need ledger matches.

### **Scenario:**
```
Bank #1:  Payment to ABC   -$1,000  (error posted)
Bank #2:  Reversal         +$1,000  (correction next day)
Ledger:   (no entries)

Net = $0. MT-08 pairs them together, marks as "self-cancelling".
No ledger match needed.
```

### **Logic:**
1. **Run AFTER MT-01 & MT-02** on unmatched bank transactions
2. Find pairs:
   - Opposite amounts (+/- same value)
   - Within ±3 days
   - Related descriptions (reversal, correction, cancel, void keywords)
3. Mark both as: `status: 'classified'`, `type: 'self_cancelling'`
4. Link the pair together

### **Result:**
- Both transactions removed from "unknown" pool
- User sees: "Reversal pair: $1,000 payment + $1,000 reversal = $0 (no ledger entry needed)"
- Explains why no ledger match exists

### **Special Handling:**
- If only one side exists, flag for investigation
- Multi-day reversals common (weekend delays)

---

## MT-09: TIMING DIFFERENCES ⭐ Important

### **Purpose:**
Match transactions with date mismatches (common in banking).

### **Scenario:**
```
Bank:    Payment processed  Jan 13
Ledger:  Payment recorded   Jan 15

2-day timing difference
```

### **Logic:**
1. Relax date matching: ±5 days (configurable)
2. Amount must be exact
3. Description similarity >70%
4. Common in:
   - Check clearance (3-5 day delay)
   - Wire transfers (1-2 day delay)
   - Weekend processing

### **Learning:**
- Track per-entity timing patterns
- "ABC Corp always 2 days early"
- Adjust tolerance per entity

---

## MT-10: CURRENCY CONVERSION

### **Purpose:**
Match foreign currency transactions with conversions.

### **Scenario:**
```
Bank:    Payment EUR 850  (= $1,000 at 0.85 rate)
Ledger:  Payment USD $1,000

Match with currency conversion
```

### **Logic:**
1. Detect currency field in optional fields
2. Apply conversion rates (fetch from external API or config)
3. Match converted amount ±2%
4. Mark as "currency_converted"

### **Complexity:**
- Need exchange rate data
- Rate fluctuations
- Not all banks provide currency info

---

## MT-11: ROUNDING DIFFERENCES

### **Purpose:**
Match transactions with minor rounding discrepancies.

### **Scenario:**
```
Bank:    Payment  $1,000.49
Ledger:  Payment  $1,000.50

$0.01 difference (rounding)
```

### **Logic:**
1. Amount difference ≤ $0.05 (or 0.01% of amount)
2. All other fields match well
3. Common causes:
   - Tax calculations
   - Percentage-based fees
   - Currency conversions

---

## MT-12: HIGH-VOLUME PAYER

### **Purpose:**
Aggregate matching for entities with many small transactions.

### **Scenario:**
```
Bank:    ABC Corp   $10, $15, $8, $12, $20... (100 txns)
Ledger:  ABC Corp total   $2,450

Batch matching
```

### **Logic:**
1. Identify high-volume payers (>20 txns in period)
2. Group all transactions by entity
3. Check if sum matches ledger total ±1%
4. Present as bulk match
5. User approves entire batch

---

## MT-13: STANDING ORDERS

### **Purpose:**
Match recurring payments with predictable patterns.

### **Scenario:**
```
Rent payment: $2,000 on 1st of every month
Utility bill: $150 on 5th of every month
```

### **Logic:**
1. Detect recurring patterns:
   - Same amount ±5%
   - Same day of month ±2 days
   - Same description
   - Occurs ≥3 times
2. Auto-match with high confidence
3. **Uses entity profile frequency data**

---

## MT-14: UNMATCHED POOL MANAGEMENT

### **Purpose:**
Organize and manage transactions that didn't match in earlier steps.

### **Scenario:**
After MT-01 through MT-13, still have unmatched transactions.

### **Logic:**
1. Categorize unmatched by:
   - Missing information (no ref number)
   - Ambiguous descriptions
   - Amount mismatches
   - Date outliers
2. Suggest:
   - "Need more data"
   - "Possible typo"
   - "Check original documents"
3. Prepare for manual review (MT-15)

---

## MT-15: MANUAL CLASSIFICATION

### **Purpose:**
User-assisted matching for complex cases.

### **Scenario:**
Transaction requires user judgment - system can't decide.

### **Logic:**
1. Present unmatched transaction to user
2. Show all possible ledger candidates (even weak matches)
3. User selects or creates new ledger entry
4. **Record user decision for learning**
5. Update entity profile with user preference

---

## MT-16: FINAL VALIDATION ⭐ Critical

### **Purpose:**
Safety checks before committing matches.

### **Scenario:**
Validate all staged matches for data integrity.

### **Logic:**
1. **Safety checks:**
   - No credit-to-debit matches
   - No duplicate matches (1 bank → 2 ledgers)
   - Amount sign consistency
   - Date reasonableness (not future dates)

2. **Business rule checks:**
   - Reconciliation totals balance
   - No orphaned transactions
   - All mandatory fields present

3. **Confidence review:**
   - Flag matches <70% confidence for user review
   - Escalate ambiguous matches

4. **Final report:**
   - Coverage: X% matched
   - Manual review needed: Y transactions
   - Safety warnings: Z issues

---

## 🔄 EXECUTION ORDER

```
PHASE 1: MAIN MATCHING (Find pairs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MT-01: Exact Match
2. MT-02: Near-Exact Match
   
   After these: ~70-80% matched ✓
   Remaining: 20-30% unmatched (need classification)

PHASE 2: EXCEPTION CLASSIFICATION (Reduce unknowns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. MT-07: Duplicates (remove from pool)
4. MT-08: Reversals (pair them up)
5. MT-03: Bank Fees (classify as fee)
6. MT-04: Interest (classify as interest)
7. MT-11: Rounding (accept variance)
8. MT-09: Timing Issues (flag for next period)

   After these: ~85-90% resolved ✓
   Remaining: 10-15% still unknown

PHASE 3: COMPLEX MATCHING (Special cases)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. MT-05: Split Payments
10. MT-06: Consolidated Deposits (multi-bank)
11. MT-13: Standing Orders
12. MT-12: High-Volume Payers
13. MT-10: Currency Conversion

   After these: ~95% resolved ✓
   Remaining: 5% truly unknown

PHASE 4: CLEANUP (Handle remaining)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. MT-14: Unmatched Pool Organization
15. MT-15: Manual Classification
16. MT-16: Final Validation

   After these: 100% addressed ✓
```

**Key Insight:** Each step removes transactions from the "unknown" pool by either:
- Matching them (MT-05, 06, 10, 12, 13)
- Classifying them (MT-03, 04, 07, 08, 09, 11)
- Organizing them (MT-14, 15, 16)

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1 (MVP):**
- MT-01: Exact Match
- MT-02: Near-Exact
- MT-09: Timing Differences
- MT-16: Final Validation

### **Phase 2:**
- MT-05: Split Payments
- MT-06: Consolidated Deposits
- MT-07: Duplicates
- MT-08: Reversals

### **Phase 3:**
- MT-03: Bank Fees
- MT-04: Interest
- MT-11: Rounding
- MT-13: Standing Orders

### **Phase 4:**
- MT-10: Currency Conversion
- MT-12: High-Volume Payers
- MT-14: Unmatched Pool
- MT-15: Manual Classification

---

## ✅ KEY PATTERNS

### **Two Types of MT Services:**

#### **Type 1: Matchers (MT-01, 02, 05, 06, 10, 12, 13)**
Find bank ↔ ledger pairs
```typescript
interface MTMatcherOutput {
  primary: MatchCandidateDto | null;
  additional: MatchCandidateDto[];
  reason: string;
}
```

#### **Type 2: Classifiers (MT-03, 04, 07, 08, 09, 11)**
Identify transactions that won't match
```typescript
interface MTClassifierOutput {
  classified: boolean;
  classificationType: 'bank_fee' | 'interest' | 'duplicate' | 'reversal' | 'timing' | 'rounding';
  confidence: number;
  reason: string;
  actionNeeded: 'none' | 'review' | 'wait_next_period';
}
```

### **Common Methods:**
- **Matchers:** `findMatches()`, `calculateScore()`, `validateMatch()`
- **Classifiers:** `classify()`, `detectPattern()`, `shouldIgnore()`

---

## 📝 NOTES FOR CLAUDE CODE

1. **Start with MT-01 and MT-02** - These are the main matchers
2. **MT-03+ run on UNMATCHED transactions only** - Don't re-process matched ones
3. **Classifiers mark, don't match** - They explain WHY there's no match
4. **Each service is independent** - Can be developed/tested separately
5. **Multi-bank aware** - Handle `bankId` in all services
6. **Return appropriate format** - Matchers return candidates, Classifiers return classification

---

## 🎯 THE BIG PICTURE

```
Start: 1000 bank transactions

After MT-01 & MT-02:
✓ 750 matched to ledger
✗ 250 unmatched (unknown)

Run MT-03 to MT-13 on the 250:
✓ 40 classified as bank fees
✓ 10 classified as interest
✓ 15 classified as duplicates
✓ 20 identified as reversals
✓ 30 flagged for timing issues
✓ 5 accepted as rounding
✓ 80 matched via complex matching (splits, consolidations, etc.)
✗ 50 still unknown

Run MT-14 to MT-16:
✓ 50 organized for manual review
✓ 30 manually classified by user
✗ 20 remain truly unresolved

Final Result:
- 98% resolved (matched or classified)
- 2% need investigation
```

---

**Key Success Metric:** 
Reduce "unknown" transactions from 25% to <5% through intelligent classification.

---

**Claude Code has everything needed to implement MT-03 through MT-16!**
