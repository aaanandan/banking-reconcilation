# CLARIFIED MATCHING STRATEGY - QUICK REFERENCE

## Core vs Additional Columns Approach

---

## 🎯 THE STRATEGY (Simplified)

### **Rule #1: Core Columns Drive Primary Matching**
```
Matching Service ALWAYS matches on:
  ✓ Date
  ✓ Amount  
  ✓ Description

This produces PRIMARY candidates
```

### **Rule #2: Additional Columns Find MORE Matches**
```
Weight calculation THEN uses optional columns to find:
  ✓ Additional candidates (based on ref_number)
  ✓ Additional candidates (based on payer_payee)
  ✓ Additional candidates (based on other fields)

These are SUGGESTIONS, not primary matches
```

### **Rule #3: User Sees Both**
```
UI displays:
  ✅ Primary Match: Ledger #45 (85% on core fields)
  
  ⚠️ Alternative Matches:
     → Ledger #52 (70% core, but 95% ref_number match)
     → Ledger #67 (65% core, but 90% payer match)
```

---

## 💡 VISUAL EXAMPLE

### Scenario: Matching Bank Transaction #127

```typescript
Bank Transaction #127:
{
  id: 127,
  date: '2025-01-15',
  amount: 1000,
  description: 'ABC Corp Payment',
  optional: {
    refNumber: 'REF-12345',
    txnType: 'credit'
  }
}
```

### Step 1: Primary Matching (Core Fields Only)

```typescript
// Matching service compares ONLY core fields
const primaryCandidates = matchOnCoreFields(bankTxn, ledgerPool);

Result:
[
  {
    ledgerId: 45,
    confidence: 0.85,
    matchBasis: ['date', 'amount', 'description'],
    scores: {
      date: 0.9,
      amount: 1.0,
      description: 0.75
    },
    reasoning: 'Strong match on core fields'
  }
]
```

### Step 2: Additional Matching (Using Optional Fields)

```typescript
// Weight calculation finds MORE candidates using optional fields
const additionalCandidates = findAdditionalMatches(
  bankTxn, 
  ledgerPool, 
  primaryCandidates // Exclude primaries
);

Result:
[
  {
    ledgerId: 52,
    confidence: 0.78,
    matchedOn: 'ref_number',
    coreScore: 0.70,        // Core fields: 70%
    additionalScore: 0.95,  // Ref number: 95%!
    reasoning: 'Core: 70%, Strong ref match: 95%'
  },
  {
    ledgerId: 67,
    confidence: 0.72,
    matchedOn: 'payer_payee',
    coreScore: 0.65,        // Core fields: 65%
    additionalScore: 0.88,  // Payer match: 88%
    reasoning: 'Core: 65%, Payer found in description: 88%'
  }
]
```

### Step 3: User Interface Display

```
Transaction #127: $1,000, Jan 15, "ABC Corp Payment"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PRIMARY MATCH (Core Fields)

Ledger #45: $1,000, Jan 15, "ABC Corporation Monthly"
Confidence: 85%
Match Basis: date (90%), amount (100%), description (75%)

[Approve] [View Details] [See Alternatives]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ALTERNATIVE MATCHES (Additional Fields)

Ledger #52: $1,000, Jan 12, "ABC Corp Monthly Invoice"
Core Match: 70%
Reference Number Match: 95% ← Strong signal!
Ref: Bank: REF-12345 | Ledger: 12345

[Use This Instead] [View Details]

Ledger #67: $1,000, Jan 14, "Payment from ABC Corp"
Core Match: 65%
Payer Match: 88% ← Payer name found!
Payer: "ABC Corp" found in bank description

[Use This Instead] [View Details]
```

---

## 🔧 TYPESCRIPT IMPLEMENTATION PATTERN

### Service Structure

```typescript
class MatchingService {
  async findMatches(
    bankTxns: TransactionDto[],
    ledgerPool: TransactionDto[],
    thresholds: MatchThresholdsDto,
    fieldProfile: FieldProfileDto,
  ): Promise<MatchResultDto> {
    
    // STEP 1: Find primary matches (core fields only)
    const primary = this.findPrimaryMatches(
      bankTxns,
      ledgerPool,
      thresholds
    );
    
    // STEP 2: Find additional matches (optional fields)
    const additional = this.findAdditionalMatches(
      bankTxns,
      ledgerPool,
      thresholds,
      fieldProfile,
      primary  // Exclude primaries from additional
    );
    
    return {
      primaryCandidates: primary,
      additionalCandidates: additional,
      fieldUsage: { /* stats */ }
    };
  }
  
  // Uses ONLY date, amount, description
  private findPrimaryMatches(/*...*/) {
    for (const bankTxn of bankTxns) {
      for (const ledgerTxn of ledgerPool) {
        const score = 
          this.dateScore(bankTxn, ledgerTxn) * 0.30 +
          this.amountScore(bankTxn, ledgerTxn) * 0.40 +
          this.descScore(bankTxn, ledgerTxn) * 0.30;
        
        if (score >= threshold) {
          candidates.push({
            ledgerId: ledgerTxn.id,
            confidence: score,
            matchBasis: ['date', 'amount', 'description']
          });
        }
      }
    }
  }
  
  // Uses ref_number, payer, etc. to find MORE candidates
  private findAdditionalMatches(
    bankTxns,
    ledgerPool,
    thresholds,
    fieldProfile,
    primaryCandidates
  ) {
    const primaryLedgerIds = new Set(
      primaryCandidates.map(c => c.ledgerId)
    );
    
    for (const bankTxn of bankTxns) {
      for (const ledgerTxn of ledgerPool) {
        // Skip if already in primary
        if (primaryLedgerIds.has(ledgerTxn.id)) continue;
        
        // Calculate core score
        const coreScore = this.calculateCoreScore(bankTxn, ledgerTxn);
        
        // Try ref_number match
        if (fieldProfile.hasRefNumbers) {
          const refScore = this.refMatch(bankTxn, ledgerTxn);
          
          if (refScore > 0.9 && coreScore >= 0.5) {
            // Strong ref match + decent core match
            additionalCandidates.push({
              ledgerId: ledgerTxn.id,
              matchedOn: 'ref_number',
              coreScore: coreScore,
              additionalScore: refScore,
              confidence: coreScore * 0.6 + refScore * 0.4
            });
          }
        }
        
        // Try payer match
        if (fieldProfile.hasPayerInLedger) {
          const payerScore = this.payerInDescription(
            ledgerTxn.optional.payerPayee,
            bankTxn.description
          );
          
          if (payerScore > 0.8 && coreScore >= 0.4) {
            additionalCandidates.push({
              ledgerId: ledgerTxn.id,
              matchedOn: 'payer_payee',
              coreScore: coreScore,
              additionalScore: payerScore,
              confidence: coreScore * 0.7 + payerScore * 0.3
            });
          }
        }
      }
    }
    
    return additionalCandidates;
  }
}
```

---

## 📊 RETURN VALUE STRUCTURE

```typescript
interface MatchResultDto {
  step: string;
  
  // PRIMARY: Matched on core fields
  primaryCandidates: MatchCandidateDto[];
  
  // ADDITIONAL: Found using optional fields
  additionalCandidates: AdditionalMatchCandidateDto[];
  
  fieldUsage: {
    coreFieldsUsed: string[];          // Always ['date', 'amount', 'description']
    refNumberMatched: number;          // Count of additional matches via ref
    payerUsed: number;                 // Count of additional matches via payer
    txnTypeVetoed: number;             // Count vetoed by txn type safety
    avgConfidence: number;
  };
}

interface MatchCandidateDto {
  bankId: number;
  ledgerId: number;
  confidence: number;                  // Based on core fields
  scores: {
    date: number;
    amount: number;
    description: number;
    base: number;                      // Total core score
  };
  matchBasis: string[];                // ['date', 'amount', 'description']
  reasoning: string;
}

interface AdditionalMatchCandidateDto {
  bankId: number;
  ledgerId: number;
  confidence: number;                  // Combined score
  matchedOn: string;                   // 'ref_number' | 'payer_payee' | etc.
  coreScore: number;                   // Score on core fields alone
  additionalScore: number;             // Score on the additional field
  reasoning: string;                   // Explanation of the match
}
```

---

## 🎓 KEY BENEFITS OF THIS APPROACH

### 1. **Core Fields Always Work**
```
Even with NO optional fields:
  ✓ System finds primary matches
  ✓ User can approve/reject
  ✓ Reconciliation completes
```

### 2. **Optional Fields Add Value**
```
With ref_numbers or payer fields:
  ✓ System finds MORE candidates
  ✓ User gets alternatives
  ✓ Better chance of finding correct match
```

### 3. **Clear Separation**
```
Primary = "Strong on fundamentals"
Additional = "Interesting alternative based on other signals"

User makes the final call
```

### 4. **Learning Improves Both**
```
Learning Service tracks:
  → Which primary matches user approves
  → Which additional matches user prefers
  → Adjusts weights accordingly
```

---

## 🚀 REAL-WORLD FLOW

### Scenario: User Reviews Transaction #127

```
Step 1: System runs MT-02 (Near-Exact Match)
  → Finds 1 primary candidate (85% core)
  → Finds 2 additional candidates (ref + payer)

Step 2: UI shows all 3 options
  → Primary highlighted (recommended)
  → Alternatives shown separately

Step 3: User action
  
  Option A: User approves primary
    → Match committed
    → Learning: "Core matching worked well"
  
  Option B: User chooses additional (ref match)
    → Match committed
    → Learning: "For this payer, ref_number is more reliable"
    → Future: Increase ref_number weight for this payer
  
  Option C: User rejects all
    → Transaction flagged for manual review
    → Learning: "None of the signals worked, need human judgment"
```

---

## ✅ VALIDATION CHECKLIST

Before implementing:

- [ ] Understand primary vs additional matching separation
- [ ] Confirm core fields are: date, amount, description
- [ ] Confirm optional fields are: ref_number, txn_type, payer_payee, etc.
- [ ] Agree on return structure (primary + additional arrays)
- [ ] Agree on UI showing both primary and alternatives
- [ ] Understand learning tracks both categories

---

## 📝 IMPLEMENTATION TODO

### Phase 1: Core Infrastructure
- [ ] Create shared DTOs (TransactionDto, MatchResultDto, etc.)
- [ ] Build Data Prep Service (column mapping + normalization)
- [ ] Build State Manager (store transactions + field profile)

### Phase 2: Matching Services
- [ ] Implement MT-01 (Exact Match) - core fields only
- [ ] Implement MT-02 (Near-Exact) - core + additional
- [ ] Implement remaining MT-03 through MT-16

### Phase 3: Orchestrator & Learning
- [ ] Build Orchestrator (invokes matching services)
- [ ] Build Learning Service (tracks field effectiveness)
- [ ] Integrate ML model updates

### Phase 4: UI & Testing
- [ ] Build UI to show primary + additional matches
- [ ] Test with various data quality levels
- [ ] Validate learning improves accuracy over time

---

## 🎯 SUMMARY

**Matching Strategy:**
1. Core fields (date, amount, description) → Primary matches
2. Optional fields (ref, payer, etc.) → Additional suggestions
3. User sees both, chooses best

**Why This Works:**
- ✅ System always functional (core fields mandatory)
- ✅ System gets smarter (optional fields add value)
- ✅ User in control (sees all options)
- ✅ Learning effective (tracks both categories)

**TypeScript Implementation:**
- ✅ Type-safe DTOs for all structures
- ✅ NestJS microservices
- ✅ Clear separation of concerns
- ✅ Swagger documentation

---

**Ready to implement! Any questions?** 🚀
