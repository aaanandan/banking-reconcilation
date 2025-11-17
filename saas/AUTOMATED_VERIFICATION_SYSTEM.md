# AUTOMATED VERIFICATION SYSTEM

## Step-by-Step Verification Checklist

**Claude Code MUST complete this checklist after EVERY step**

---

## 📋 **VERIFICATION TEMPLATE (USE FOR EVERY STEP)**

```markdown
═══════════════════════════════════════════════════════════
✓ STEP [NUMBER] VERIFICATION
═══════════════════════════════════════════════════════════

Step Title: [title]
Category: [Database/Service/Frontend/Cloud/etc.]
Time Started: [HH:MM]
Time Completed: [HH:MM]
Duration: [minutes]

1. PRE-EXECUTION CHECKLIST:
   □ Read step from guide
   □ Understood what to do
   □ Identified files to modify/create
   □ Asked human for confirmation
   □ Got "yes" approval

2. EXECUTION CHECKLIST:
   □ Referenced correct document section
   □ Copied code exactly (no modifications)
   □ Created all required files
   □ Updated all required files
   □ No extra changes made

3. FILE VERIFICATION:
   Files Created:
   □ [file1] - ✅ exists, ✅ correct size
   □ [file2] - ✅ exists, ✅ correct size
   
   Files Modified:
   □ [file3] - ✅ changes match spec
   □ [file4] - ✅ changes match spec

4. COMPILATION VERIFICATION:
   □ TypeScript compiles: $ npm run build
      Result: [✅ Success / ❌ Error]
      
   □ No syntax errors
      Result: [✅ None / ❌ Found X errors]
      
   □ No type errors
      Result: [✅ None / ❌ Found X errors]

5. TESTING VERIFICATION:
   □ Unit tests pass: $ npm run test
      Result: [X/Y passed]
      
   □ Integration tests (if applicable)
      Result: [X/Y passed]
      
   □ No new test failures
      Result: [✅ / ❌]

6. RUNTIME VERIFICATION (if applicable):
   □ Service starts: $ npm run start:dev
      Result: [✅ Started / ❌ Failed]
      
   □ Health check passes: $ curl localhost:PORT/health
      Result: [✅ 200 OK / ❌ Error]
      
   □ No runtime errors in logs
      Result: [✅ / ❌]

7. CODE QUALITY VERIFICATION:
   □ ESLint passes: $ npm run lint
      Result: [✅ No issues / ❌ X issues]
      
   □ Prettier formatted: $ npm run format:check
      Result: [✅ Formatted / ❌ Needs formatting]
      
   □ No console.log() statements left
      Result: [✅ / ❌]

8. GIT VERIFICATION:
   □ Git status clean (only expected files)
      $ git status
      Modified: [list files]
      
   □ No untracked files (except expected)
      Result: [✅ / ❌]
      
   □ Changes match step requirements
      Result: [✅ / ❌]

9. DOCUMENTATION VERIFICATION:
   □ Code comments added (if complex)
      Result: [✅ / ❌ / N/A]
      
   □ No TODOs left
      Result: [✅ / ❌]
      
   □ No FIXMEs left
      Result: [✅ / ❌]

10. FINAL CHECKLIST:
    □ Step completed exactly as specified
    □ All verifications passed
    □ No errors or warnings
    □ No shortcuts taken
    □ Ready for human review

VERIFICATION RESULT: [✅ ALL PASS / ❌ FAILURES FOUND]

[If failures, list them and STOP]

═══════════════════════════════════════════════════════════
```

---

## 🔍 **PHASE-SPECIFIC VERIFICATION CHECKLISTS**

### **PHASE 1: Database Steps (Steps 1-20)**

```markdown
═══════════════════════════════════════════════════════════
DATABASE STEP VERIFICATION
═══════════════════════════════════════════════════════════

Entity/Migration: [name]

1. ENTITY VERIFICATION (if creating/updating entity):
   □ Entity file created/updated
   □ @Entity decorator present
   □ Primary key defined
   □ tenantId column added (if multi-tenant entity)
   □ tenantId has @Index()
   □ All required columns defined
   □ Relations properly defined
   □ TypeORM decorators correct
   
   Verify:
   $ cat [entity-file] | grep "tenantId"
   $ cat [entity-file] | grep "@Index()"

2. MIGRATION VERIFICATION (if migration):
   □ Migration file created
   □ Up method defined
   □ Down method defined
   □ SQL syntax correct
   □ Migration can run
   □ Migration can rollback
   
   Test:
   $ npm run migration:show
   $ npm run migration:run
   $ npm run migration:revert

3. DATABASE VERIFICATION:
   □ Table created/updated
   □ Columns match specification
   □ Indexes created
   □ Foreign keys correct
   
   Check:
   $ psql $DATABASE_URL -c "\d [table_name]"
   $ psql $DATABASE_URL -c "\di [table_name]*"

4. DATA INTEGRITY:
   □ No data loss
   □ Existing records preserved
   □ Default values applied
   
   Verify:
   $ psql $DATABASE_URL -c "SELECT COUNT(*) FROM [table]"

RESULT: [✅ PASS / ❌ FAIL]
═══════════════════════════════════════════════════════════
```

### **PHASE 1: Service Steps (Steps 21-50)**

```markdown
═══════════════════════════════════════════════════════════
SERVICE UPDATE VERIFICATION
═══════════════════════════════════════════════════════════

Service: [service-name]

1. SERVICE CODE VERIFICATION:
   □ Service file updated
   □ TenantAwareRepository used
   □ tenantId passed to all queries
   □ No queries missing tenantId filter
   □ All CRUD operations tenant-aware
   
   Verify:
   $ grep -n "findOne\|find\|update\|delete" [service-file]
   $ grep -n "tenantId" [service-file]

2. CONTROLLER VERIFICATION:
   □ Controller uses @TenantContext() decorator
   □ tenantId extracted from JWT
   □ tenantId passed to service methods
   
   Verify:
   $ grep -n "@TenantContext()" [controller-file]

3. DTO VERIFICATION:
   □ DTOs updated (if needed)
   □ Validation added
   □ No tenantId in DTOs (comes from context)

4. TEST VERIFICATION:
   □ Service tests pass
   □ Tenant isolation test added
   □ Cross-tenant access blocked
   
   Run:
   $ npm run test -- [service-name]

5. API VERIFICATION:
   □ Service starts
   □ Endpoints respond
   □ Requires authentication
   □ Returns only tenant data
   
   Test:
   $ curl -H "Authorization: Bearer $TOKEN" \
          http://localhost:[PORT]/[endpoint]

RESULT: [✅ PASS / ❌ FAIL]
═══════════════════════════════════════════════════════════
```

### **PHASE 2: Frontend Steps (Steps 61-140)**

```markdown
═══════════════════════════════════════════════════════════
FRONTEND COMPONENT VERIFICATION
═══════════════════════════════════════════════════════════

Component: [component-name]
Type: [Page/Component]

1. FILE STRUCTURE:
   □ Component file created
   □ Component follows naming convention
   □ TypeScript types defined
   □ Props interface defined
   
   Location: src/[pages|components]/[name]/[name].tsx

2. COMPONENT CODE:
   □ Uses functional component
   □ TypeScript types correct
   □ Props properly typed
   □ State management (if needed)
   □ Ant Design components used
   □ No inline styles (uses design tokens)
   
3. API INTEGRATION (if applicable):
   □ API client imported
   □ React Query used
   □ Loading states handled
   □ Error states handled
   □ Success states handled

4. STYLING:
   □ Responsive design implemented
   □ Design system tokens used
   □ No hardcoded colors
   □ No hardcoded spacing
   □ Mobile-friendly

5. ACCESSIBILITY:
   □ Semantic HTML used
   □ ARIA labels added (if needed)
   □ Keyboard navigation works
   □ Tab order correct

6. TESTING:
   □ Component renders
   □ No console errors
   □ No console warnings
   □ Props validation works
   
   Test:
   $ npm run dev
   # Visit component in browser
   # Check console

7. VISUAL VERIFICATION:
   □ Matches design specification
   □ Layout correct
   □ Colors correct
   □ Typography correct
   □ Spacing correct
   □ Icons correct

RESULT: [✅ PASS / ❌ FAIL]
═══════════════════════════════════════════════════════════
```

### **PHASE 3: Cloud/DevOps Steps (Steps 141-200)**

```markdown
═══════════════════════════════════════════════════════════
CLOUD INFRASTRUCTURE VERIFICATION
═══════════════════════════════════════════════════════════

Resource: [resource-name]
Service: [AWS/K8s/etc]

1. RESOURCE CREATION:
   □ Command executed successfully
   □ Resource ID captured
   □ Resource in correct region
   □ Tags applied
   
   Verify:
   $ aws [service] describe-[resource] --[resource-id] $ID

2. CONFIGURATION:
   □ Configuration matches spec
   □ Security settings correct
   □ Networking correct
   □ Permissions correct
   
   Check:
   $ aws [service] describe-[resource] --query [field]

3. CONNECTIVITY:
   □ Resource reachable
   □ Health checks pass
   □ No errors in logs
   
   Test:
   $ curl [endpoint]
   $ kubectl get [resource]

4. SECURITY:
   □ Security groups correct
   □ IAM roles correct
   □ Encryption enabled
   □ Backups configured

5. COST:
   □ Resource within budget
   □ No unnecessary resources
   □ Tags for cost tracking
   
   Check:
   $ aws ce get-cost-and-usage ...

RESULT: [✅ PASS / ❌ FAIL]
═══════════════════════════════════════════════════════════
```

---

## 📊 **CUMULATIVE PROGRESS TRACKER**

Claude Code must update this after EVERY step:

```markdown
═══════════════════════════════════════════════════════════
📊 CUMULATIVE PROGRESS TRACKER
═══════════════════════════════════════════════════════════

Last Updated: [Date Time]
Current Step: [X] / 280
Overall Progress: [X.XX]%

PHASE 1: MULTI-TENANCY (Steps 1-60)
├─ Week 1: Database (Steps 1-20)
│  ├─ ✅ Step 1: Create Tenant Entity (5 min)
│  ├─ ✅ Step 2: Update User Entity (3 min)
│  ├─ ✅ Step 3: Update Reconciliation Entity (3 min)
│  ├─ ⏳ Step 4: Update BankFile Entity (in progress)
│  └─ ⬜ Steps 5-20 (pending)
│
├─ Week 2: Services (Steps 21-50)
│  └─ ⬜ Steps 21-50 (pending)
│
└─ Week 3: Testing (Steps 51-60)
   └─ ⬜ Steps 51-60 (pending)

PHASE 2: FRONTEND (Steps 61-140)
└─ ⬜ All pending

PHASE 3: CLOUD (Steps 141-190)
└─ ⬜ All pending

[... all other phases ...]

STATISTICS:
- Total Time Invested: [X] hours
- Average Time per Step: [X] minutes
- Steps This Session: [X]
- Estimated Completion: [Date]

CURRENT MILESTONE: [milestone name]
Next Milestone: [next milestone name]

═══════════════════════════════════════════════════════════
```

---

## 🎯 **DAILY PROGRESS REPORT**

At end of each day, Claude Code generates:

```markdown
═══════════════════════════════════════════════════════════
📅 DAILY PROGRESS REPORT - [Date]
═══════════════════════════════════════════════════════════

SESSION INFO:
- Start Time: [HH:MM]
- End Time: [HH:MM]
- Duration: [X] hours
- Steps Completed: [X]
- Average per Step: [X] minutes

STEPS COMPLETED TODAY:
✅ Step 1: Create Tenant Entity (5 min)
✅ Step 2: Update User Entity (3 min)
✅ Step 3: Update Reconciliation Entity (3 min)
✅ Step 4: Update BankFile Entity (3 min)
✅ Step 5: Update LedgerFile Entity (3 min)

VERIFICATION SUMMARY:
- Total Verifications: [X]
- All Passed: [✅/❌]
- Issues Found: [X]
- Issues Resolved: [X]

FILES MODIFIED:
- libs/shared/src/entities/tenant.entity.ts (new)
- libs/shared/src/entities/user.entity.ts (modified)
- libs/shared/src/entities/reconciliation.entity.ts (modified)
- libs/shared/src/entities/bank-file.entity.ts (modified)
- libs/shared/src/entities/ledger-file.entity.ts (modified)

TESTS STATUS:
- Unit Tests: 82/82 passed ✅
- Integration Tests: 15/15 passed ✅
- New Tests Added: 3

GIT STATUS:
- Modified Files: 5
- New Files: 1
- Ready to Commit: ✅

ISSUES ENCOUNTERED:
[None / List issues]

BLOCKERS:
[None / List blockers]

TOMORROW'S PLAN:
- Target Steps: 6-15 (10 steps)
- Estimated Time: 30-40 minutes
- Goal: Complete all entity updates

HUMAN REVIEW NEEDED:
[Yes/No - if yes, explain what]

═══════════════════════════════════════════════════════════
```

---

## 🚨 **ERROR TRACKING SYSTEM**

When errors occur, log them:

```markdown
═══════════════════════════════════════════════════════════
🚨 ERROR LOG - Entry #[X]
═══════════════════════════════════════════════════════════

Date/Time: [timestamp]
Step: [step number]
Phase: [phase name]

ERROR TYPE: [Compilation/Runtime/Test/Build/Deployment]

ERROR MESSAGE:
[exact error message]

STACK TRACE:
[if applicable]

CONTEXT:
- What I was doing: [description]
- Command executed: [command]
- Expected result: [description]
- Actual result: [description]

ROOT CAUSE:
[analysis of why error occurred]

RESOLUTION:
□ Waiting for human input
□ Fixed by: [description]
□ Workaround: [description]

PREVENTION:
[how to prevent in future]

STATUS: [OPEN/RESOLVED]
Resolved at: [timestamp]
Resolved by: [human/claude]

═══════════════════════════════════════════════════════════
```

---

## ✅ **PHASE COMPLETION CERTIFICATE**

After completing each phase:

```markdown
═══════════════════════════════════════════════════════════
🎊 PHASE COMPLETION CERTIFICATE
═══════════════════════════════════════════════════════════

PHASE: [number and name]
STATUS: ✅ COMPLETE

COMPLETION DETAILS:
- Start Date: [date]
- End Date: [date]
- Duration: [days/weeks]
- Steps Completed: [X]-[Y] (total: [Z] steps)

STATISTICS:
- Total Time: [X] hours
- Average per Step: [X] minutes
- Fastest Step: [X] ([Y] min)
- Slowest Step: [X] ([Y] min)

CODE METRICS:
- Files Created: [X]
- Files Modified: [X]
- Lines Added: [X]
- Lines Removed: [X]

TEST RESULTS:
- Unit Tests: [X]/[Y] ✅
- Integration Tests: [X]/[Y] ✅
- E2E Tests: [X]/[Y] ✅
- Code Coverage: [X]%

QUALITY CHECKS:
✅ All verifications passed
✅ All tests passing
✅ No ESLint errors
✅ No TypeScript errors
✅ Code formatted
✅ Documentation updated
✅ Git history clean

DELIVERABLES:
✅ [deliverable 1]
✅ [deliverable 2]
✅ [deliverable 3]

HUMAN REVIEW:
□ Pending
□ Approved by: [name]
□ Date: [date]

NEXT PHASE: [phase name]
Target Start: [date]

NOTES:
[any special notes about this phase]

═══════════════════════════════════════════════════════════
```

---

## 📈 **WEEKLY SUMMARY REPORT**

End of each week:

```markdown
═══════════════════════════════════════════════════════════
📈 WEEKLY SUMMARY - Week [X] of 20
═══════════════════════════════════════════════════════════

Date Range: [start] to [end]

PROGRESS:
- Steps Completed: [X] (target: [Y])
- Progress: [X]% (target: [Y]%)
- On Track: [✅ / ⚠️  / ❌]

ACCOMPLISHMENTS:
✅ [accomplishment 1]
✅ [accomplishment 2]
✅ [accomplishment 3]

TIME TRACKING:
- Total Hours: [X]
- vs Budget: [over/under by X hours]
- Productivity: [X steps/hour]

ISSUES RESOLVED: [X]
ISSUES OPEN: [X]

BLOCKERS: [list]

NEXT WEEK PLAN:
- Target Steps: [X]-[Y]
- Target Hours: [X]
- Key Milestones: [list]

HUMAN ATTENTION NEEDED:
[list if any]

═══════════════════════════════════════════════════════════
```

---

## 🎯 **HOW TO USE THIS SYSTEM**

### **For Claude Code:**

1. **After EVERY step**, complete the step verification checklist
2. **Update progress tracker** after each step
3. **Generate daily report** at end of session
4. **Log all errors** immediately when they occur
5. **Create phase certificate** when phase completes
6. **Generate weekly summary** every 7 days

### **For Human:**

1. **Review daily reports** to track progress
2. **Check verification checklists** for thoroughness
3. **Monitor error logs** for patterns
4. **Approve phase certificates** before next phase
5. **Review weekly summaries** for planning

---

## 📋 **VERIFICATION CHECKLIST STORAGE**

All verification checklists should be saved to:
```
/project-root/verification-logs/
├── step-001-verification.md
├── step-002-verification.md
├── step-003-verification.md
├── ...
├── daily-report-2025-11-16.md
├── weekly-report-week-01.md
├── phase-01-certificate.md
└── error-log.md
```

**Claude Code**: Create this directory structure on first step.

---

**END OF VERIFICATION SYSTEM**

This ensures COMPLETE ACCOUNTABILITY and PROGRESS TRACKING.
