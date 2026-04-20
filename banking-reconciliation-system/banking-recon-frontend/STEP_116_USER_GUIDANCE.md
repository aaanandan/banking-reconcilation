# Step 116: User Guidance Enhancements

**Date:** November 18, 2025
**Step:** 116/280 (41.4%)
**Status:** ✅ COMPLETE

---

## Overview

Step 116 adds comprehensive user guidance features to the column mapping functionality. This includes mapping templates for reusability, best practices guidance, common mistake detection, and contextual tips to help users create high-quality mappings efficiently.

---

## Files Created

### 1. Mapping Templates Utility

**File:** `src/utils/mappingTemplates.ts` (529 lines)

**Purpose:** Complete template management system for saving and loading column mappings

**Key Features:**

#### Predefined Templates

6 built-in templates for common banks and ledger formats:

| Template ID | Name | Type | Columns |
|------------|------|------|---------|
| template_hdfc_bank | HDFC Bank Statement | bank | Transaction Date, Amount, Description, Ref No, Balance |
| template_icici_bank | ICICI Bank Statement | bank | Date, Debit, Credit, Narration, Cheque No |
| template_sbi_bank | State Bank of India | bank | Txn Date, Debit, Credit, Description, Ref No, Balance |
| template_axis_bank | Axis Bank Statement | bank | Transaction Date, Debit, Credit, Particulars, Chq/Ref |
| template_general_ledger | General Ledger (Standard) | ledger | Entry Date, Amount, Particulars, Voucher No |
| template_tally_export | Tally Export Format | ledger | Date, Debit, Credit, Particulars, Vch No |

#### Template Structure

```typescript
interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  bankName?: string;
  fileType: 'bank' | 'ledger';
  mappings: ColumnMapping[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  tags: string[];
}
```

#### Core Functions

**`getAllTemplates()`**
- Returns all templates (predefined + user-created)
- Templates stored in browser localStorage

**`getTemplatesByType(fileType)`**
- Filters templates by file type (bank/ledger)
- Used to show relevant templates only

**`searchTemplates(query)`**
- Searches templates by name, description, tags, or bank name
- Case-insensitive search

**`saveTemplate(template)`**
- Saves a new user template to localStorage
- Auto-generates unique ID and timestamps
- Returns saved template object

**`deleteTemplate(id)`**
- Deletes a user template
- Predefined templates cannot be deleted
- Returns success/failure boolean

**`applyTemplate(template, detectedColumnNames)`**
- Matches template columns to detected columns
- Returns array of suggested mappings
- Case-insensitive column name matching
- Increments template usage count

**`findMatchingTemplates(detectedColumnNames, fileType, limit)`**
- Finds templates that match detected columns
- Returns templates sorted by match score
- Calculates confidence based on matched columns
- Returns:
  ```typescript
  {
    template: MappingTemplate;
    score: number;          // 0-100 based on column matches
    matchedColumns: number; // Count of matched columns
    totalColumns: number;   // Total columns in template
    confidence: number;     // 0-100 match confidence
  }
  ```

**Example:**
```typescript
const matches = findMatchingTemplates(
  ['Transaction Date', 'Amount', 'Description'],
  'bank',
  5
);
// Returns top 5 matching templates sorted by score
```

**`exportTemplates(templateIds?)`**
- Exports templates as JSON string
- Can export specific templates or all user templates
- Used for sharing templates or backup

**`importTemplates(jsonString)`**
- Imports templates from JSON
- Validates each template before import
- Returns: `{ success: number, failed: number, errors: string[] }`

**Recent Templates Tracking:**
- `getRecentTemplates()` - Returns last 5 used templates
- Stored separately in localStorage
- Updated automatically when template is applied

---

### 2. Mapping Guidance Utility

**File:** `src/utils/mappingGuidance.ts` (455 lines)

**Purpose:** Best practices, common mistakes, and contextual tips for users

**Best Practices (10 total):**

| ID | Title | Category | Importance |
|----|-------|----------|------------|
| bp_required_fields | Map All Required Fields | mapping | high |
| bp_type_matching | Match Field Types Correctly | mapping | high |
| bp_debit_credit | Use Debit/Credit When Applicable | mapping | medium |
| bp_reference_mapping | Map Reference Numbers | mapping | medium |
| bp_consistent_format | Ensure Consistent Data Format | data-quality | high |
| bp_check_duplicates | Review Duplicate Transactions | data-quality | medium |
| bp_date_range | Verify Date Ranges Match | data-quality | high |
| bp_save_templates | Save Mappings as Templates | performance | medium |
| bp_sample_review | Review Sample Data | mapping | high |
| bp_balance_validation | Validate Running Balance | data-quality | low |

**Best Practice Structure:**
```typescript
interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: 'mapping' | 'data-quality' | 'performance' | 'troubleshooting';
  importance: 'high' | 'medium' | 'low';
  icon: string;
  tips: string[];
  examples?: {
    good: string;
    bad: string;
  };
}
```

**Common Mistakes (10 total):**

| ID | Title | Severity | Category |
|----|-------|----------|----------|
| mistake_missing_required | Missing Required Field Mapping | error | mapping |
| mistake_type_mismatch | Field Type Mismatch | error | mapping |
| mistake_duplicate_mapping | Duplicate Target Field Mapping | error | mapping |
| mistake_mixed_date_formats | Inconsistent Date Formats | warning | data-quality |
| mistake_mixed_currency | Mixed Currency Symbols | error | data-quality |
| mistake_only_one_debit_credit | Only Debit or Credit Mapped | warning | mapping |
| mistake_debit_credit_overlap | Rows Have Both Debit and Credit | warning | data-quality |
| mistake_high_duplicates | High Percentage of Duplicates | warning | data-quality |
| mistake_no_reference | Reference Number Not Mapped | info | mapping |
| mistake_no_balance | Balance Column Not Mapped | info | mapping |

**Common Mistake Structure:**
```typescript
interface CommonMistake {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'mapping' | 'data-quality' | 'configuration';
  howToFix: string[];
  relatedBestPractice?: string;
}
```

**Mistake Detection:**

`detectMistakes(detectedColumns, mappings)` - Automatically detects issues:
- Missing required fields (date, amount, description)
- Duplicate target field mappings
- Only one of debit/credit mapped when both columns exist
- Reference column detected but not mapped
- Balance column detected but not mapped

**Example:**
```typescript
const mistakes = detectMistakes(detectedColumns, mappings);
// Returns: DetectedMistake[]
// [
//   {
//     mistake: { id: 'mistake_missing_required', ... },
//     context: "Required field 'date' is not mapped",
//     affectedFields: ['date']
//   }
// ]
```

**Contextual Tips:**

`getContextualTips(detectedColumns, mappings, validationScore)` - Dynamic tips based on state:
- Suggests mapping optional fields when required fields are complete
- Recommends saving template when validation score is high (≥90)
- Alerts about unmapped columns
- Suggests using debit/credit instead of amount when applicable

**Quick Start Tips:**
- 8 predefined tips for helping new users
- `getRandomQuickStartTip()` - Returns random tip to show
- Examples:
  - "💡 Start by mapping the three required fields: Date, Amount, and Description"
  - "📋 Save your mapping as a template to reuse it for similar files"
  - "⚠️ Pay attention to type mismatch warnings to avoid import errors"

---

### 3. MappingTemplatesManager Component

**File:** `src/components/ColumnMapping/MappingTemplatesManager.tsx` (364 lines)

**Purpose:** Modal component for saving and loading mapping templates

**Props:**
```typescript
interface MappingTemplatesManagerProps {
  visible: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  fileType: 'bank' | 'ledger';
  currentMappings?: ColumnMapping[];
  detectedColumnNames?: string[];
  onApplyTemplate?: (mappings: ColumnMapping[]) => void;
}
```

**Save Mode Features:**
- Form to enter template name, description, bank name
- Tag selection for categorization
- Validates template before saving
- Shows count of mappings being saved
- Saves to localStorage with auto-generated ID

**Load Mode Features:**

1. **Recommended Templates Section**
   - Shows templates matching detected columns
   - Displays match score (0-100%)
   - Shows matched columns count
   - Sorted by best match first
   - Click to apply template

2. **Recently Used Section**
   - Shows last 5 used templates
   - Quick access to frequently used templates
   - Click to apply template

3. **All Templates Section**
   - Searchable list of all templates
   - Displays: name, description, bank, tags, mapping count
   - Predefined templates marked with blue tag
   - User templates can be deleted
   - Click any template to apply

4. **Search Functionality**
   - Search by template name, description, bank, or tags
   - Real-time filtering
   - Case-insensitive

5. **Import/Export**
   - Export templates to JSON file
   - Import templates from JSON file
   - Validates imported templates
   - Shows success/failure counts

**Usage Example:**
```tsx
const [showTemplates, setShowTemplates] = useState(false);
const [templateMode, setTemplateMode] = useState<'save' | 'load'>('load');

<Button onClick={() => {
  setTemplateMode('load');
  setShowTemplates(true);
}}>
  Load Template
</Button>

<MappingTemplatesManager
  visible={showTemplates}
  onClose={() => setShowTemplates(false)}
  mode={templateMode}
  fileType="bank"
  currentMappings={mappings}
  detectedColumnNames={detectedColumns.map(c => c.columnName)}
  onApplyTemplate={(newMappings) => {
    // Apply the template mappings
    setMappings(newMappings);
  }}
/>
```

---

### 4. BestPracticesPanel Component

**File:** `src/components/ColumnMapping/BestPracticesPanel.tsx** (262 lines)

**Purpose:** Display best practices, detect mistakes, and show contextual tips

**Props:**
```typescript
interface BestPracticesPanelProps {
  detectedColumns: DetectedColumn[];
  mappings: ColumnMapping[];
  validationScore?: number;
}
```

**Features:**

1. **Quick Start Tip**
   - Random tip shown at top
   - Dismissable alert
   - Changes each time panel loads
   - Icon: ⚡ ThunderboltOutlined

2. **Contextual Tips**
   - Dynamic tips based on current state
   - Success/info/warning alerts
   - Action buttons when applicable
   - Examples:
     - "All required fields are mapped! Consider mapping optional fields..."
     - "Your mapping looks great! Consider saving it as a template."
     - "5 columns are not yet mapped. Review if any should be included."

3. **Detected Issues Section**
   - Real-time mistake detection
   - Shows title, severity, context
   - Step-by-step "how to fix" instructions
   - Color-coded by severity (red/orange/blue)
   - Icon indicators (error/warning/info)

4. **Best Practices Accordion**
   - Organized by importance (High/Recommended/Optional)
   - Collapsible panels
   - Each practice shows:
     - Title and importance tag
     - Description
     - List of tips
     - Good vs Bad examples (when available)
   - Color-coded importance badges:
     - High Priority: Red badge
     - Recommended: Orange badge
     - Optional: Blue badge

5. **Common Mistakes Reference**
   - Collapsible accordion
   - All 10 common mistakes listed
   - Each shows:
     - Title with severity icon
     - Description
     - "How to fix" steps
   - Useful as learning resource

**Visual Layout:**

```
┌──────────────────────────────────────────────┐
│ 🌟 Mapping Guidance                          │
├──────────────────────────────────────────────┤
│ ⚡ Quick Tip                                 │
│ 💡 Start by mapping the three required...   │
├──────────────────────────────────────────────┤
│ ℹ Your mapping looks great! [Save Template] │
├──────────────────────────────────────────────┤
│ ⚠ Detected Issues                           │
│ ┌────────────────────────────────────────┐  │
│ │ ✗ Missing Required Field Mapping       │  │
│ │ Required field 'date' is not mapped    │  │
│ │ How to fix:                            │  │
│ │ • Locate the date column in your file  │  │
│ │ • Map it to the date target field      │  │
│ └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ ✓ Best Practices                            │
│ ▼ High Priority Best Practices              │
│ ▼ Recommended Practices                     │
│ ▼ Optional Enhancements                     │
├──────────────────────────────────────────────┤
│ ℹ Common Mistakes to Avoid                  │
│ ▶ Missing Required Field Mapping            │
│ ▶ Field Type Mismatch                       │
│ ▶ ...                                        │
└──────────────────────────────────────────────┘
```

**Usage Example:**
```tsx
<BestPracticesPanel
  detectedColumns={detectedColumns}
  mappings={currentMappings}
  validationScore={mappingQuality?.score}
/>
```

---

## Integration Pattern

### How to Integrate into ColumnMapping Component

**1. Import components and utilities:**
```typescript
import {
  MappingTemplatesManager,
  BestPracticesPanel,
} from '../../components/ColumnMapping';
import {
  findMatchingTemplates,
  applyTemplate,
} from '../../utils/mappingTemplates';
import {
  detectMistakes,
  getContextualTips,
} from '../../utils/mappingGuidance';
```

**2. Add state:**
```typescript
const [showTemplateManager, setShowTemplateManager] = useState(false);
const [templateMode, setTemplateMode] = useState<'save' | 'load'>('load');
```

**3. Add toolbar buttons:**
```tsx
<Space>
  <Button
    icon={<FolderOpenOutlined />}
    onClick={() => {
      setTemplateMode('load');
      setShowTemplateManager(true);
    }}
  >
    Load Template
  </Button>
  <Button
    icon={<SaveOutlined />}
    onClick={() => {
      setTemplateMode('save');
      setShowTemplateManager(true);
    }}
    disabled={!isComplete}
  >
    Save as Template
  </Button>
</Space>
```

**4. Add template manager modal:**
```tsx
<MappingTemplatesManager
  visible={showTemplateManager}
  onClose={() => setShowTemplateManager(false)}
  mode={templateMode}
  fileType={isBankFile ? 'bank' : 'ledger'}
  currentMappings={currentFile.mappings}
  detectedColumnNames={currentFile.detectedColumns.map(c => c.columnName)}
  onApplyTemplate={(mappings) => {
    // Apply template mappings
    const updatedMappings = [...fileMappings];
    updatedMappings[fileIndex].mappings = mappings;
    setFileMappings(updatedMappings);
  }}
/>
```

**5. Add best practices panel:**
```tsx
<Row style={{ marginTop: 24 }}>
  <Col span={24}>
    <BestPracticesPanel
      detectedColumns={currentFile.detectedColumns}
      mappings={currentFile.mappings}
      validationScore={mappingQuality?.score}
    />
  </Col>
</Row>
```

**6. (Optional) Auto-suggest templates on file load:**
```typescript
useEffect(() => {
  if (detectedColumns.length > 0) {
    const matches = findMatchingTemplates(
      detectedColumns.map(c => c.columnName),
      'bank',
      1
    );

    if (matches.length > 0 && matches[0].score >= 80) {
      // High confidence match - suggest to user
      message.info({
        content: `Found template "${matches[0].template.name}" with ${matches[0].score}% match. Click to apply.`,
        duration: 10,
        onClick: () => {
          const mappings = applyTemplate(matches[0].template, detectedColumns.map(c => c.columnName));
          setMappings(mappings);
        },
      });
    }
  }
}, [detectedColumns]);
```

---

## Benefits

### For Users:
1. **Faster Setup:** Reuse templates instead of mapping columns every time
2. **Guided Learning:** Best practices help users understand requirements
3. **Error Prevention:** Automatic mistake detection catches issues early
4. **Confidence:** Contextual tips provide reassurance and suggestions
5. **Knowledge Base:** Common mistakes reference serves as learning resource

### For System:
1. **Data Quality:** Better mappings lead to better reconciliation results
2. **User Adoption:** Easier learning curve for new users
3. **Efficiency:** Templates save time on repetitive tasks
4. **Consistency:** Best practices promote standard workflows
5. **Support Reduction:** Self-service guidance reduces support tickets

---

## Template Storage

### LocalStorage Structure

**Templates:**
```
Key: 'banking_recon_mapping_templates'
Value: JSON array of MappingTemplate objects
```

**Recent Templates:**
```
Key: 'banking_recon_recent_templates'
Value: JSON array of template IDs (max 5)
```

**Example:**
```javascript
// Get all user templates
const stored = localStorage.getItem('banking_recon_mapping_templates');
const templates = JSON.parse(stored);

// Get recent templates
const recent = localStorage.getItem('banking_recon_recent_templates');
const recentIds = JSON.parse(recent); // ['template_123', 'template_456', ...]
```

---

## Example User Workflows

### Workflow 1: First Time User

1. User uploads bank statement CSV
2. System detects columns and shows Quick Start Tip
3. BestPracticesPanel shows "Detected Issues" - missing required fields
4. User maps date, amount, description following "how to fix" instructions
5. System shows success tip: "All required fields mapped!"
6. User reviews mapping preview
7. User clicks "Save as Template" for future use

### Workflow 2: Returning User

1. User uploads same bank's CSV file
2. System detects columns
3. MappingTemplatesManager auto-shows recommended template (90% match)
4. User clicks "Apply" on HDFC Bank template
5. All mappings applied instantly
6. User reviews and proceeds to reconciliation
7. Time saved: ~2-3 minutes per file

### Workflow 3: Sharing Templates

1. Power user creates and tests mapping template
2. User clicks "Export" in template manager
3. Downloads JSON file: `mapping-templates-bank-1234567890.json`
4. Shares file with team via email/Slack
5. Team member clicks "Import" in template manager
6. Selects downloaded JSON file
7. Template now available to team member
8. Organization builds library of standardized templates

### Workflow 4: Mistake Prevention

1. User maps columns incorrectly (date → amount field)
2. BestPracticesPanel immediately shows:
   - Detected Issue: "Field Type Mismatch"
   - Severity: ERROR
   - How to fix: "Match date columns to date fields only..."
3. User corrects mapping following instructions
4. Issue disappears from detected issues
5. User proceeds with confidence

---

## Testing

### Template Management Tests

Create `src/utils/mappingTemplates.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTemplate,
  getAllTemplates,
  deleteTemplate,
  findMatchingTemplates,
  applyTemplate,
} from './mappingTemplates';

describe('mappingTemplates', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveTemplate', () => {
    it('should save a new template', () => {
      const template = saveTemplate({
        name: 'Test Template',
        description: 'Test description',
        fileType: 'bank',
        mappings: [
          { sourceColumn: 'Date', targetField: 'date' },
          { sourceColumn: 'Amount', targetField: 'amount' },
        ],
        tags: ['test'],
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Test Template');
      expect(template.mappings.length).toBe(2);
    });
  });

  describe('findMatchingTemplates', () => {
    it('should find matching templates', () => {
      const matches = findMatchingTemplates(
        ['Transaction Date', 'Amount', 'Description'],
        'bank',
        5
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].score).toBeGreaterThan(0);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to detected columns', () => {
      const templates = getAllTemplates();
      const hdfc = templates.find(t => t.id === 'template_hdfc_bank');

      const mappings = applyTemplate(
        hdfc!,
        ['Transaction Date', 'Amount', 'Description']
      );

      expect(mappings.length).toBe(3);
      expect(mappings[0].targetField).toBe('date');
    });
  });
});
```

### Guidance Tests

Create `src/utils/mappingGuidance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  detectMistakes,
  getContextualTips,
  BEST_PRACTICES,
  COMMON_MISTAKES,
} from './mappingGuidance';

describe('mappingGuidance', () => {
  describe('detectMistakes', () => {
    it('should detect missing required fields', () => {
      const mistakes = detectMistakes(
        [],
        [{ sourceColumn: 'Date', targetField: 'date' }]
      );

      expect(mistakes.length).toBeGreaterThan(0);
      expect(mistakes.some(m => m.mistake.id === 'mistake_missing_required')).toBe(true);
    });

    it('should detect duplicate mappings', () => {
      const mistakes = detectMistakes(
        [],
        [
          { sourceColumn: 'Date1', targetField: 'date' },
          { sourceColumn: 'Date2', targetField: 'date' },
        ]
      );

      expect(mistakes.some(m => m.mistake.id === 'mistake_duplicate_mapping')).toBe(true);
    });
  });

  describe('contextual tips', () => {
    it('should suggest saving template for high score', () => {
      const tips = getContextualTips(
        [],
        [
          { sourceColumn: 'Date', targetField: 'date' },
          { sourceColumn: 'Amount', targetField: 'amount' },
          { sourceColumn: 'Description', targetField: 'description' },
        ],
        95
      );

      expect(tips.some(t => t.id === 'tip_save_template')).toBe(true);
    });
  });
});
```

---

## Summary

**Step 116 Achievements:**

✅ Created mapping templates utility (529 lines)
✅ Implemented 6 predefined bank/ledger templates
✅ Built template save/load/search/delete functionality
✅ Created template matching algorithm (0-100 score)
✅ Implemented export/import for sharing templates

✅ Created mapping guidance utility (455 lines)
✅ Defined 10 best practices with tips and examples
✅ Defined 10 common mistakes with fix instructions
✅ Built automatic mistake detection
✅ Created contextual tip system
✅ Added 8 quick start tips

✅ Built MappingTemplatesManager component (364 lines)
✅ Implemented save/load template modal
✅ Created recommended templates section with match scoring
✅ Added recent templates quick access
✅ Built template search functionality
✅ Implemented import/export features

✅ Built BestPracticesPanel component (262 lines)
✅ Created detected issues section with fix instructions
✅ Implemented best practices accordion (organized by importance)
✅ Added common mistakes reference
✅ Built contextual tips display
✅ Added random quick start tips

**Total New Code:** ~1,610 lines
**Components:** 2 React components
**Utilities:** 2 utility modules with 30+ functions
**Templates:** 6 predefined templates for common banks
**Best Practices:** 10 best practices with examples
**Common Mistakes:** 10 mistakes with fix instructions

**Status:** ✅ User guidance infrastructure complete and ready for integration
**Next:** Step 117 - Performance optimization (lazy validation, memoization, debouncing)
