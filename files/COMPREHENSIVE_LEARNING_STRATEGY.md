# LEARNING SERVICE - COMPREHENSIVE TAGGING STRATEGY

## Tag Everything, Learn Everywhere

---

## 🎯 CORE PRINCIPLE

**Learn from EVERY transaction, regardless of match status:**
- ✅ Exact matches → Learn patterns
- ✅ Near matches → Learn user preferences
- ✅ User overrides → Learn corrections
- ✅ Classified transactions → Learn exceptions
- ✅ Manual entries → Learn special cases

**Goal:** Build complete knowledge base from all reconciliation activity.

---

## 📊 TAGGING DURING MATCHING

### **MT-01 & MT-02: Tag While Matching**

Even when transactions match perfectly, tag them for learning:

```typescript
// In MT-02 service
async findMatches(bankTxn, ledgerPool, fieldProfile) {
  const matches = this.performMatching(bankTxn, ledgerPool);
  
  // ═══════════════════════════════════════════════════════════
  // TAGGING FOR LEARNING (happens regardless of match quality)
  // ═══════════════════════════════════════════════════════════
  const tags = this.detectTransactionTags(bankTxn);
  
  // Tag examples:
  if (this.isBankFee(bankTxn.description)) {
    tags.push('bank_fee');
    this.queueLearningQuestion({
      type: 'pattern_confirmation',
      question: `Is "${bankTxn.description}" a regular bank fee?`,
      context: 'Even though matched, we want to learn the pattern',
      relatedTransaction: bankTxn.id
    });
  }
  
  if (this.isInterest(bankTxn.description)) {
    tags.push('interest_income');
    this.queueLearningQuestion({
      type: 'pattern_confirmation',
      question: `What is your typical monthly interest amount?`,
      context: 'Building interest expectation model',
      relatedTransaction: bankTxn.id
    });
  }
  
  if (this.isRecurringPayment(bankTxn, historicalData)) {
    tags.push('recurring');
    this.queueLearningQuestion({
      type: 'frequency_confirmation',
      question: `Does payment to "${bankTxn.description}" occur monthly?`,
      context: 'Detected potential recurring pattern',
      relatedTransaction: bankTxn.id
    });
  }
  
  // Store tags with match result
  return {
    primary: matchCandidate,
    additional: additionalCandidates,
    tags: tags,  // NEW: Tags for learning
    learningQuestionsQueued: 3
  };
}
```

---

## 🏷️ TRANSACTION TAG TYPES

### **Pattern Tags:**
```typescript
interface TransactionTags {
  // Financial type
  transactionType?: 'bank_fee' | 'interest' | 'payment' | 'deposit' | 'transfer' | 'withdrawal';
  
  // Frequency pattern
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'one_time';
  
  // Entity relationship
  entity?: string;  // "ABC Corp", "Utility Company", etc.
  entityConfidence?: number;  // 0-1
  
  // Amount pattern
  amountPattern?: 'fixed' | 'variable' | 'incremental' | 'percentage';
  
  // Timing pattern
  timingPattern?: 'fixed_day' | 'month_end' | 'irregular';
  preferredDay?: number;  // e.g., 15th of month
  
  // Special characteristics
  isRecurring?: boolean;
  isSplit?: boolean;
  isConsolidated?: boolean;
  isReversal?: boolean;
  isDuplicate?: boolean;
  
  // Learning metadata
  taggedBy: string;  // Which MT service tagged it
  tagConfidence: number;  // How confident the tag is
  needsUserConfirmation: boolean;
}
```

---

## 📝 LEARNING QUESTIONS BY SCENARIO

### **Scenario 1: Matched Bank Fee**

```
Transaction:
  Bank: "Monthly maintenance fee" -$25
  Ledger: "Bank charges" -$25
  Match: ✓ Exact match by MT-01

Tags Generated:
  - transactionType: 'bank_fee'
  - frequency: 'monthly'
  - amountPattern: 'fixed'
  - taggedBy: 'MT-01'

Learning Questions Queued:
  Q1: [DEFERRED, LOW]
      "Is 'Monthly maintenance fee' always $25?"
      → Learn: Fixed fee amount
      
  Q2: [DEFERRED, MEDIUM]
      "Does this fee occur on a specific day each month?"
      → Learn: Timing pattern
      
  Q3: [DEFERRED, LOW]
      "Do you want to auto-classify similar fees in future?"
      → Learn: User preference
```

---

### **Scenario 2: Matched Interest (User Override)**

```
Transaction:
  Bank: "Interest earned" +$12.50
  Ledger: "Interest income" +$12.50
  Match: ✓ MT-02 suggested Ledger #45
  User Action: ❌ REJECTED, selected Ledger #50 instead

Tags Generated:
  - transactionType: 'interest'
  - frequency: 'monthly'
  - taggedBy: 'MT-02'

Learning Questions Queued:
  Q1: [IMMEDIATE, HIGH]
      "Why did you choose Ledger #50 instead of #45?"
      Options: 
        - Different account
        - Better description match
        - Correct date
        - Other
      → Learn: User preference for interest matching
      
  Q2: [STEP_END, MEDIUM]
      "What is your typical monthly interest range?"
      → Learn: Expected interest amount
      
  Q3: [DEFERRED, LOW]
      "Does interest always post on the same day?"
      → Learn: Timing pattern

User Feedback Recorded:
  - Override reason: "Better description match"
  - Learning update: Increase description weight for interest transactions
```

---

### **Scenario 3: Recurring Payment Detected**

```
Transaction:
  Bank: "Rent payment to Landlord LLC" -$2,000
  Ledger: "Rent expense" -$2,000
  Match: ✓ Exact match
  
Historical Analysis:
  - Same amount last 6 months
  - Always on 1st of month
  - Same description

Tags Generated:
  - transactionType: 'payment'
  - frequency: 'monthly'
  - amountPattern: 'fixed'
  - timingPattern: 'fixed_day'
  - preferredDay: 1
  - isRecurring: true
  - entity: 'Landlord LLC'

Learning Questions Queued:
  Q1: [SESSION_END, MEDIUM]
      "Is 'Rent payment to Landlord LLC' a standing order?"
      → Learn: Recurring classification
      
  Q2: [DEFERRED, LOW]
      "Will this payment amount change in future?"
      → Learn: Pattern stability
      
Entity Profile Updated:
  - Create/Update profile for "Landlord LLC"
  - Business pattern: Monthly, $2,000, Day 1
  - Reconciliation behavior: Always exact match
```

---

### **Scenario 4: Split Payment (Multi-bank)**

```
Transaction:
  Bank_HDFC: "Payment to ABC Corp" -$500
  Bank_ICICI: "Payment to ABC Corp" -$500
  Ledger: "ABC Corp invoice" -$1,000
  Match: ✓ MT-05 (Split Payment)
  
Tags Generated:
  - transactionType: 'payment'
  - isSplit: true
  - entity: 'ABC Corp'
  - taggedBy: 'MT-05'

Learning Questions Queued:
  Q1: [SESSION_END, HIGH]
      "Does ABC Corp often receive split payments from multiple banks?"
      → Learn: Entity-specific behavior
      
  Q2: [DEFERRED, MEDIUM]
      "Is there a pattern to how payments split between HDFC and ICICI?"
      → Learn: Multi-bank distribution pattern
      
Entity Profile Updated:
  - ABC Corp behavior: Often receives split payments
  - Bank distribution: HDFC + ICICI common
  - Future: Suggest split matching for ABC Corp automatically
```

---

### **Scenario 5: Unmatched Bank Fee**

```
Transaction:
  Bank: "ATM withdrawal fee" -$3
  Ledger: (no entry)
  Match: ✗ Unmatched
  Classification: ✓ MT-03 (Bank Fee)

Tags Generated:
  - transactionType: 'bank_fee'
  - frequency: 'irregular'  // ATM fees vary
  - amountPattern: 'fixed'   // Usually $3
  - taggedBy: 'MT-03'

Learning Questions Queued:
  Q1: [SESSION_END, MEDIUM]
      "Are ATM fees always $3 at your bank?"
      → Learn: Fee structure
      
  Q2: [DEFERRED, LOW]
      "Do you want to track ATM fees separately?"
      → Learn: Reporting preference
      
  Q3: [DEFERRED, LOW]
      "Should ATM fees be recorded in ledger in future?"
      → Learn: Accounting policy

Classification Result:
  - Status: 'classified'
  - Type: 'bank_fee'
  - Reason: "ATM withdrawal fee - no ledger entry expected"
  - Action: None required
```

---

## 🔄 COMPLETE LEARNING FLOW

```
ANY Transaction Processing
         ↓
    Detect Patterns
    (All MT services)
         ↓
    Generate Tags
    (Transaction characteristics)
         ↓
    Queue Learning Questions
    (Based on tags + context)
         ↓
    Match/Classify Transaction
    (Primary purpose of MT service)
         ↓
    Record User Action
    (Approve/Override/Reject)
         ↓
    Update Entity Profile
    (Incorporate learning)
         ↓
    Adjust Future Matching
    (Apply learned patterns)
```

---

## 📊 LEARNING QUESTIONS PRIORITY

### **IMMEDIATE (Ask now):**
- User overrides system suggestion
- Ambiguous classification
- Critical business rule needed

### **STEP_END (After step completes):**
- Pattern confirmation
- Frequency validation
- Entity relationship

### **SESSION_END (After reconciliation):**
- General preferences
- Accounting policies
- Reporting needs

### **DEFERRED (Anytime later):**
- Nice-to-have context
- Long-term patterns
- Optional enhancements

---

## 🎯 LEARNING SERVICE API UPDATES

### **New Endpoint: Tag Transaction**

```typescript
POST /learning/tag-transaction

Request:
{
  transactionId: number,
  tags: TransactionTags,
  matchResult?: MatchCandidateDto,
  userAction?: 'approved' | 'overridden' | 'rejected',
  stepName: string  // Which MT service tagged it
}

Response:
{
  tagged: boolean,
  questionsGenerated: number,
  entityProfileUpdated: boolean,
  tags: TransactionTags
}
```

### **New Endpoint: Bulk Tag Analysis**

```typescript
POST /learning/analyze-tags

Request:
{
  reconciliationId: string
}

Response:
{
  summary: {
    totalTransactions: number,
    taggedTransactions: number,
    byType: {
      bank_fee: number,
      interest: number,
      recurring: number,
      // ...
    },
    patterns: {
      newEntitiesDetected: string[],
      recurringPaymentsFound: number,
      splitPaymentsFound: number
    }
  },
  questionsGenerated: number,
  entityProfilesCreated: number,
  entityProfilesUpdated: number
}
```

---

## 🔧 IMPLEMENTATION IN MT SERVICES

### **Every MT Service Should:**

```typescript
class MTService {
  async findMatches(bankTxn, ledgerPool, fieldProfile) {
    // 1. Perform matching/classification
    const result = this.performMatching(bankTxn, ledgerPool);
    
    // 2. Generate tags
    const tags = this.detectPatterns(bankTxn);
    
    // 3. Queue learning questions
    const questions = this.generateLearningQuestions(bankTxn, tags, result);
    
    // 4. Send to Learning Service
    await this.learningService.tagTransaction({
      transactionId: bankTxn.id,
      tags: tags,
      matchResult: result,
      stepName: this.serviceName
    });
    
    // 5. Return result (matching/classification)
    return result;
  }
  
  private detectPatterns(txn: Transaction): TransactionTags {
    return {
      transactionType: this.detectType(txn),
      frequency: this.detectFrequency(txn),
      entity: this.extractEntity(txn),
      isRecurring: this.checkRecurring(txn),
      // ... more tags
    };
  }
  
  private generateLearningQuestions(txn, tags, result): LearningQuestion[] {
    const questions = [];
    
    // Question based on tags
    if (tags.transactionType === 'bank_fee') {
      questions.push({
        type: 'pattern_confirmation',
        priority: 'low',
        timing: 'deferred',
        question: `Is "${txn.description}" a regular fee?`,
        // ...
      });
    }
    
    // Question based on match result
    if (result.confidence < 0.9) {
      questions.push({
        type: 'match_confidence',
        priority: 'medium',
        timing: 'step_end',
        question: `Is this match correct?`,
        // ...
      });
    }
    
    return questions;
  }
}
```

---

## ✅ BENEFITS

### **1. Complete Learning:**
- Learn from successes (exact matches)
- Learn from near-misses (fuzzy matches)
- Learn from failures (unmatched)
- Learn from user corrections (overrides)

### **2. Better Classification:**
```
First month:
  - 10 bank fees manually classified
  
Second month:
  - System auto-identifies 8/10 based on learned patterns
  - Questions only 2 ambiguous cases
  
Third month:
  - System auto-identifies 10/10
  - Zero questions needed
```

### **3. Smarter Matching:**
```
User always overrides MT-02 for "Rent" transactions
  → Learning Service detects pattern
  → Increases description weight for rent
  → Future rent matches have higher confidence
  → No more overrides needed
```

### **4. Entity Intelligence:**
```
ABC Corp:
  - Tagged in 15 transactions
  - Always pays via HDFC bank
  - Always $1,000 ± $50
  - Always on 15th of month
  - Split payments rare (1 out of 15)
  
Future ABC Corp transactions:
  → System knows the pattern
  → Higher confidence matching
  → Flags anomalies automatically
```

---

## 📝 SUMMARY

**Tag everything, learn everywhere:**

1. ✅ MT-01/02 tag while matching
2. ✅ MT-03+ tag while classifying
3. ✅ Learning Service processes all tags
4. ✅ Questions generated for all transactions
5. ✅ Entity profiles built from all data
6. ✅ Future matching improves continuously

**Result:**
- Complete knowledge base
- No learning opportunities missed
- System gets smarter with every reconciliation
- User effort decreases over time

---

**This is the complete learning strategy!** ✅
