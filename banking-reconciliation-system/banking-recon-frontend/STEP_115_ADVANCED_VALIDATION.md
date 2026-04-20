# Step 115: Advanced Validation Features

**Date:** November 18, 2025
**Step:** 115/280 (41.1%)
**Status:** ✅ COMPLETE

---

## Overview

Step 115 extends the validation infrastructure from Step 114 with advanced data quality checks. This step adds sophisticated validation for date formats, currency handling, duplicate transaction detection, and multi-column debit/credit validation.

---

## Files Created

### 1. Advanced Validation Utilities

**File:** `src/utils/advancedValidation.ts` (654 lines)

**Purpose:** Comprehensive advanced validation logic for data quality

**Key Functions:**

#### `validateDateFormat(sampleValues)`

Validates and detects date format from sample values.

**Returns:**
```typescript
{
  isValid: boolean,
  detectedFormat: string | null,  // e.g., "YYYY-MM-DD", "DD/MM/YYYY"
  confidence: number (0-100),
  issues: string[],
  suggestions: string[]
}
```

**Supported Date Formats:**
- `YYYY-MM-DD` (2024-01-15)
- `DD/MM/YYYY` (15/01/2024)
- `MM/DD/YYYY` (01/15/2024)
- `DD-MM-YYYY` (15-01-2024)
- `DD-Mon-YYYY` (15-Jan-2024)
- `YYYY/MM/DD` (2024/01/15)
- `Mon DD, YYYY` (Jan 15, 2024)
- `D Month YYYY` (15 January 2024)

**Example:**
```typescript
const result = validateDateFormat(['2024-01-15', '2024-01-16', '2024-01-17']);
// result.detectedFormat: "YYYY-MM-DD"
// result.confidence: 100
// result.isValid: true
```

**Validation Logic:**
- Tests each sample value against 8 common date patterns
- Counts matches for each format
- Selects format with highest match count
- Confidence = (matches / total values) × 100
- Valid if confidence ≥ 70%

---

#### `validateCurrencyFormat(sampleValues)`

Validates currency format and detects currency type.

**Returns:**
```typescript
{
  isValid: boolean,
  detectedCurrency: string | null,  // "USD", "INR", "EUR", "GBP"
  hasSymbols: boolean,
  hasMixedFormats: boolean,
  cleanedValues: number[],
  issues: string[],
  suggestions: string[]
}
```

**Supported Currencies:**
- **USD:** $ (e.g., $1,500.00)
- **INR:** ₹ (e.g., ₹1,50,000.00)
- **EUR:** € (e.g., €1.500,00)
- **GBP:** £ (e.g., £1,500.00)

**Example:**
```typescript
const result = validateCurrencyFormat(['$1,500.00', '$2,300.50', '$450.75']);
// result.detectedCurrency: "USD"
// result.hasSymbols: true
// result.hasMixedFormats: false
// result.cleanedValues: [1500.00, 2300.50, 450.75]
```

**Validation Logic:**
- Detects currency symbols in sample values
- Counts occurrences of each currency
- Flags mixed currency formats as invalid
- Cleans values by removing symbols, spaces, commas
- Parses cleaned values to numbers

---

#### `cleanCurrencyValue(value)`

Helper function to clean currency values.

**Example:**
```typescript
cleanCurrencyValue('$1,500.00')  // 1500.00
cleanCurrencyValue('₹1,50,000')  // 150000
cleanCurrencyValue('€ 1.500,00') // 1500.00 (if European format)
```

**Cleaning Rules:**
- Removes: `$`, `₹`, `€`, `£`, `,`, spaces
- Preserves: digits, decimal point, minus sign
- Returns: parsed float or null if invalid

---

#### `detectDuplicateTransactions(detectedColumns, mappings)`

Detects duplicate transactions based on date, amount, and description.

**Returns:**
```typescript
{
  hasDuplicates: boolean,
  duplicateCount: number,
  duplicateGroups: DuplicateGroup[],
  uniqueTransactionCount: number,
  duplicatePercentage: number,
  warnings: string[],
  suggestions: string[]
}
```

**DuplicateGroup Structure:**
```typescript
{
  key: string,                    // "date|amount|description"
  count: number,                  // Number of occurrences
  indices: number[],              // Row indices
  sampleValues: {
    date?: string,
    amount?: string,
    description?: string
  }
}
```

**Example:**
```typescript
const result = detectDuplicateTransactions(detectedColumns, mappings);
// result.hasDuplicates: true
// result.duplicateCount: 5
// result.duplicatePercentage: 2.0
// result.duplicateGroups: [
//   {
//     key: "2024-01-15|1500.00|Payment to vendor",
//     count: 3,
//     indices: [10, 45, 78]
//   }
// ]
```

**Detection Logic:**
- Requires date and amount columns to be mapped
- Creates composite key: `${date}|${amount}|${description}`
- Groups rows by composite key
- Flags groups with count > 1 as duplicates
- Calculates percentage of duplicates

**Use Cases:**
- Identify accidentally imported duplicate transactions
- Detect legitimate recurring payments
- Find data quality issues in source files

---

#### `validateDebitCreditColumns(detectedColumns, mappings)`

Validates multi-column amount fields (debit + credit columns).

**Returns:**
```typescript
{
  isValid: boolean,
  hasDebitCredit: boolean,
  debitCreditBalance: 'valid' | 'imbalanced' | 'not_applicable',
  balanceIssues: string[],
  totalDebit: number,
  totalCredit: number,
  netDifference: number,
  suggestions: string[]
}
```

**Example:**
```typescript
const result = validateDebitCreditColumns(detectedColumns, mappings);
// result.hasDebitCredit: true
// result.totalDebit: 15000.00
// result.totalCredit: 15000.00
// result.netDifference: 0.00
// result.debitCreditBalance: "valid"
```

**Validation Checks:**
1. **Both Columns Mapped:** Ensures both debit and credit are mapped
2. **Mutual Exclusivity:** Each row should have either debit OR credit, not both
3. **No Empty Rows:** Flags rows with neither debit nor credit
4. **Balance Calculation:** Sums debit and credit, calculates difference

**Balance Rules:**
- Each transaction should have value in EITHER debit OR credit column
- Having values in both columns is flagged as an issue
- Having neither debit nor credit is flagged as an issue
- Net difference indicates if totals balance (expected for complete period)

---

#### `runAdvancedValidation(detectedColumns, mappings)`

Runs all advanced validations and returns comprehensive summary.

**Returns:**
```typescript
{
  dateFormatValidation: DateFormatValidationResult,
  currencyValidation: CurrencyValidationResult,
  duplicateDetection: DuplicateDetectionResult,
  debitCreditValidation: MultiColumnValidationResult,
  overallScore: number (0-100),
  criticalIssues: string[],
  warnings: string[],
  recommendations: string[]
}
```

**Scoring Algorithm:**
```
Start: 100 points

Date Format Issues:
  - Invalid format: -20 points
  - Confidence < 100%: -((100 - confidence) / 10) points

Currency Issues:
  - Invalid format: -15 points
  - Mixed currencies: -10 points

Duplicate Issues:
  - >20% duplicates: -10 points

Debit/Credit Issues:
  - Invalid when mapped: -15 points

Final Score: Max(0, calculated score)
```

**Example:**
```typescript
const summary = runAdvancedValidation(detectedColumns, mappings);
// summary.overallScore: 85
// summary.criticalIssues: []
// summary.warnings: ["5% duplicate transactions detected"]
// summary.recommendations: [
//   "All dates match format: YYYY-MM-DD",
//   "Currency detected: USD",
//   "Review duplicate transactions before importing"
// ]
```

---

### 2. AdvancedValidationPanel Component

**File:** `src/components/ColumnMapping/AdvancedValidationPanel.tsx` (421 lines)

**Purpose:** Visual display of advanced validation results

**Features:**
- ✅ Overall data quality score (0-100) with progress bar
- ✅ Color-coded status (green/blue/orange/red)
- ✅ Critical issues alert (red)
- ✅ Warnings alert (orange)
- ✅ Collapsible panels for each validation type
- ✅ Detailed sub-panels for each validation
- ✅ Recommendations section

**Props:**
```typescript
interface AdvancedValidationPanelProps {
  validation: AdvancedValidationSummary;
}
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────┐
│ Advanced Validation Analysis                    │
├─────────────────────────────────────────────────┤
│ Overall Data Quality Score: 85/100 [Good]       │
│ ████████████████████░░░░░░░  85%               │
├─────────────────────────────────────────────────┤
│ ⚠ Warnings                                      │
│   • 5% duplicate transactions detected          │
├─────────────────────────────────────────────────┤
│ ▼ Date Format Validation [YYYY-MM-DD] [95%]   │
│ ▼ Currency Format Validation [USD]             │
│ ▼ Duplicate Transaction Detection [5 duplicates]│
│ ▼ Debit/Credit Column Validation               │
├─────────────────────────────────────────────────┤
│ ℹ Recommendations                               │
│   • All dates match format: YYYY-MM-DD         │
│   • Currency detected: USD                      │
│   • Review duplicate transactions               │
└─────────────────────────────────────────────────┘
```

**Sub-Components:**

#### DateFormatPanel
Displays date format validation details:
- Status (valid/invalid)
- Detected format
- Issues
- Suggestions

#### CurrencyPanel
Displays currency validation details:
- Status
- Detected currency
- Has symbols (yes/no)
- Mixed formats (yes/no)
- Sample parsed values
- Issues and suggestions

#### DuplicatesPanel
Displays duplicate detection details:
- Duplicates found (yes/no)
- Duplicate count
- Percentage
- Unique transaction count
- Sample duplicate groups (shows first 3)
- Each group shows: date, amount, description, occurrence count

#### DebitCreditPanel
Displays debit/credit validation details:
- Status
- Balance status (valid/imbalanced/not applicable)
- Total debit
- Total credit
- Net difference
- Balance issues
- Suggestions

**Usage Example:**
```tsx
import { runAdvancedValidation } from '../../utils/advancedValidation';
import { AdvancedValidationPanel } from '../../components/ColumnMapping';

const validationSummary = runAdvancedValidation(detectedColumns, mappings);

<AdvancedValidationPanel validation={validationSummary} />
```

---

## Integration Pattern

### How to Integrate with ColumnMapping Component

**1. Import utilities:**
```typescript
import {
  runAdvancedValidation,
  AdvancedValidationSummary,
} from '../../utils/advancedValidation';
import { AdvancedValidationPanel } from '../../components/ColumnMapping';
```

**2. Add state:**
```typescript
const [advancedValidation, setAdvancedValidation] =
  useState<AdvancedValidationSummary | null>(null);
```

**3. Run validation when mappings change:**
```typescript
const handleMappingChange = (columnName: string, targetField: string, ...) => {
  // ... existing code to update mappings ...

  // Run advanced validation
  const validation = runAdvancedValidation(
    updatedMappings[fileIndex].detectedColumns,
    updatedMappings[fileIndex].mappings
  );

  setAdvancedValidation(validation);

  // Consider blocking "Continue" if critical issues exist
  if (validation.criticalIssues.length > 0) {
    updatedMappings[fileIndex].hasErrors = true;
  }
};
```

**4. Add component to UI:**
```tsx
{/* After MappingQualityIndicator */}
{advancedValidation && (
  <Row style={{ marginBottom: 24 }}>
    <Col span={24}>
      <AdvancedValidationPanel validation={advancedValidation} />
    </Col>
  </Row>
)}
```

---

## Validation Flow Diagram

```
User Changes Mapping
        ↓
Update mappings state
        ↓
runAdvancedValidation()
        ↓
    ┌───┴────────────────────────────┐
    ↓                                 ↓
validateDateFormat()        validateCurrencyFormat()
    ↓                                 ↓
detectDuplicateTransactions()  validateDebitCreditColumns()
    ↓                                 ↓
    └───┬────────────────────────────┘
        ↓
Calculate overall score
        ↓
Collect issues, warnings, recommendations
        ↓
Update AdvancedValidationPanel
        ↓
Enable/disable "Continue" button based on critical issues
```

---

## Validation Rules Summary

### Date Format Validation
✅ Tests against 8 common date formats
✅ Confidence threshold: ≥70% for validity
✅ Detects most common format in sample data
✅ Flags inconsistent date formats

### Currency Validation
✅ Supports: USD ($), INR (₹), EUR (€), GBP (£)
✅ Detects and flags mixed currency symbols
✅ Cleans values for numeric parsing
✅ Validates all values can be parsed as numbers

### Duplicate Detection
✅ Creates composite key: date + amount + description
✅ Groups transactions by key
✅ Reports duplicate count and percentage
✅ Shows sample duplicate groups
✅ Requires date and amount columns to be mapped

### Debit/Credit Validation
✅ Validates both columns are mapped (if using debit/credit)
✅ Checks mutual exclusivity (each row has debit OR credit)
✅ Flags rows with both values or neither value
✅ Calculates total debit and credit
✅ Reports net difference
✅ Applicable only when debit/credit columns are used

---

## Benefits

### For Users:
1. **Data Quality Assurance:** Catches issues before import
2. **Format Detection:** Automatically identifies date and currency formats
3. **Duplicate Awareness:** Alerts users to potential duplicate data
4. **Balance Verification:** Validates debit/credit columns balance correctly

### For System:
1. **Error Prevention:** Reduces failed imports due to format issues
2. **Data Integrity:** Ensures clean, consistent data in database
3. **User Confidence:** Clear feedback builds trust in the system
4. **Debugging:** Detailed validation messages aid troubleshooting

---

## Testing

### Unit Tests

Create `src/utils/advancedValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateDateFormat,
  validateCurrencyFormat,
  cleanCurrencyValue,
  detectDuplicateTransactions,
  validateDebitCreditColumns,
} from './advancedValidation';

describe('advancedValidation', () => {
  describe('validateDateFormat', () => {
    it('should detect YYYY-MM-DD format', () => {
      const result = validateDateFormat([
        '2024-01-15',
        '2024-01-16',
        '2024-01-17',
      ]);
      expect(result.detectedFormat).toBe('YYYY-MM-DD');
      expect(result.confidence).toBe(100);
      expect(result.isValid).toBe(true);
    });

    it('should detect DD/MM/YYYY format', () => {
      const result = validateDateFormat([
        '15/01/2024',
        '16/01/2024',
        '17/01/2024',
      ]);
      expect(result.detectedFormat).toBe('DD/MM/YYYY');
      expect(result.isValid).toBe(true);
    });

    it('should flag invalid date formats', () => {
      const result = validateDateFormat(['abc', 'xyz', '123']);
      expect(result.isValid).toBe(false);
      expect(result.detectedFormat).toBeNull();
    });
  });

  describe('cleanCurrencyValue', () => {
    it('should clean USD format', () => {
      expect(cleanCurrencyValue('$1,500.00')).toBe(1500);
    });

    it('should clean INR format', () => {
      expect(cleanCurrencyValue('₹1,50,000')).toBe(150000);
    });

    it('should handle values without symbols', () => {
      expect(cleanCurrencyValue('1500.50')).toBe(1500.5);
    });

    it('should return null for invalid values', () => {
      expect(cleanCurrencyValue('abc')).toBeNull();
    });
  });

  describe('validateCurrencyFormat', () => {
    it('should detect USD currency', () => {
      const result = validateCurrencyFormat([
        '$1,500.00',
        '$2,300.50',
        '$450.75',
      ]);
      expect(result.detectedCurrency).toBe('USD');
      expect(result.hasSymbols).toBe(true);
      expect(result.hasMixedFormats).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it('should flag mixed currencies', () => {
      const result = validateCurrencyFormat(['$100', '₹200', '€300']);
      expect(result.hasMixedFormats).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });

  describe('detectDuplicateTransactions', () => {
    it('should detect duplicate transactions', () => {
      const detectedColumns = [
        {
          columnName: 'Date',
          sampleValues: ['2024-01-15', '2024-01-15', '2024-01-16'],
          detectedType: 'date',
          confidence: 0.95,
        },
        {
          columnName: 'Amount',
          sampleValues: ['1500.00', '1500.00', '2300.00'],
          detectedType: 'amount',
          confidence: 0.98,
        },
        {
          columnName: 'Description',
          sampleValues: ['Payment', 'Payment', 'Salary'],
          detectedType: 'text',
          confidence: 0.92,
        },
      ];

      const mappings = [
        { sourceColumn: 'Date', targetField: 'date' },
        { sourceColumn: 'Amount', targetField: 'amount' },
        { sourceColumn: 'Description', targetField: 'description' },
      ];

      const result = detectDuplicateTransactions(detectedColumns, mappings);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateGroups.length).toBeGreaterThan(0);
    });
  });

  describe('validateDebitCreditColumns', () => {
    it('should validate properly structured debit/credit columns', () => {
      const detectedColumns = [
        {
          columnName: 'Debit',
          sampleValues: ['1500.00', '', ''],
          detectedType: 'amount',
          confidence: 0.9,
        },
        {
          columnName: 'Credit',
          sampleValues: ['', '2300.00', '450.00'],
          detectedType: 'amount',
          confidence: 0.9,
        },
      ];

      const mappings = [
        { sourceColumn: 'Debit', targetField: 'debit' },
        { sourceColumn: 'Credit', targetField: 'credit' },
      ];

      const result = validateDebitCreditColumns(detectedColumns, mappings);
      expect(result.hasDebitCredit).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should flag rows with both debit and credit', () => {
      const detectedColumns = [
        {
          columnName: 'Debit',
          sampleValues: ['1500.00', '100.00'],
          detectedType: 'amount',
          confidence: 0.9,
        },
        {
          columnName: 'Credit',
          sampleValues: ['500.00', '200.00'],
          detectedType: 'amount',
          confidence: 0.9,
        },
      ];

      const mappings = [
        { sourceColumn: 'Debit', targetField: 'debit' },
        { sourceColumn: 'Credit', targetField: 'credit' },
      ];

      const result = validateDebitCreditColumns(detectedColumns, mappings);
      expect(result.balanceIssues.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Example Scenarios

### Scenario 1: Perfect Data Quality

**Input:**
- Date column: All values in YYYY-MM-DD format
- Amount column: All values in consistent USD format
- No duplicates detected
- Debit/credit properly structured (if applicable)

**Result:**
- Overall Score: 100/100
- Grade: Excellent
- Status: All green checkmarks
- Recommendations: "Data quality is excellent, ready to proceed"

---

### Scenario 2: Mixed Date Formats

**Input:**
- Date column: 80% YYYY-MM-DD, 20% DD/MM/YYYY

**Result:**
- Date Format Validation: 80% confidence
- Overall Score: ~85/100
- Grade: Good
- Warning: "Some values don't match detected format"
- Suggestion: "Consider cleaning data to use consistent date format"

---

### Scenario 3: Duplicate Transactions

**Input:**
- 25 duplicate transactions out of 250 (10%)

**Result:**
- Duplicate Detection: 25 duplicates, 10%
- Overall Score: ~85/100 (if other validations pass)
- Warning: "Found 5 groups of duplicate transactions"
- Suggestions:
  - "Review duplicate transactions before importing"
  - "Duplicates may indicate recurring payments"

---

### Scenario 4: Mixed Currencies

**Input:**
- Amount column: Mix of $, ₹, € symbols

**Result:**
- Currency Validation: Invalid
- Overall Score: ~70/100
- Critical Issue: "Mixed currency symbols detected: USD, INR, EUR"
- Suggestion: "Use consistent currency format across all values"

---

### Scenario 5: Debit/Credit Issues

**Input:**
- Some rows have values in both debit and credit columns

**Result:**
- Debit/Credit Validation: Imbalanced
- Overall Score: ~75/100
- Warning: "X rows have both debit and credit values"
- Suggestion: "Debit and credit columns should be mutually exclusive"

---

## Next Steps (Step 116+)

### Step 116: User Guidance Enhancements
- Interactive mapping tutorial
- Best practices tips
- Common mistakes prevention
- Mapping templates (save/load)

### Step 117: Performance Optimization
- Lazy validation (only on demand)
- Memoized validation results
- Debounced quality calculation
- Progressive validation for large datasets

### Step 118: Edge Case Handling
- Handle files with >100 columns
- Handle files with >10,000 rows
- Handle special characters in column names
- Handle multi-byte characters (UTF-8)

---

## Summary

**Step 115 Achievements:**

✅ Created advanced validation utilities (654 lines)
✅ Implemented date format detection (8 formats)
✅ Implemented currency validation (4 currencies)
✅ Implemented duplicate transaction detection
✅ Implemented debit/credit column validation
✅ Built AdvancedValidationPanel component (421 lines)
✅ Created comprehensive scoring algorithm (0-100)
✅ Defined integration pattern for ColumnMapping component
✅ Documented all validation rules and scenarios

**Total New Code:** ~1,075 lines
**Components:** 1 React component with 4 sub-components
**Utilities:** 1 validation module with 6 main functions
**Documentation:** Complete integration guide with examples

**Status:** ✅ Advanced validation infrastructure complete and ready for integration
**Next:** Step 116 - User guidance enhancements and best practices
