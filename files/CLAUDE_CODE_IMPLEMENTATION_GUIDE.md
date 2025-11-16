# BANKING RECONCILIATION SYSTEM - IMPLEMENTATION GUIDE FOR CLAUDE CODE

## Step-by-Step Progressive Implementation with Testing

This guide is specifically designed for Claude Code to implement the Banking Reconciliation System incrementally, with verification at each step.

## 🎯 IMPLEMENTATION PHILOSOPHY

### CRITICAL RULES:
1. ✅ ONE STEP AT A TIME - Complete, test, verify before moving to next
2. ✅ WORKING CODE ONLY - Every step must compile and run
3. ✅ TEST AFTER EACH STEP - No skipping verification
4. ✅ NO UNDO - Don't rewrite working code unnecessarily
5. ✅ INCREMENTAL - Build on previous steps
6. ✅ ASK IF UNCLEAR - Pause and ask when needed

## 📋 MASTER CHECKLIST (60 Steps Total)

### PHASE 1: PROJECT SETUP (Steps 1-5)
- [ ] Step 1: Initialize NestJS monorepo
- [ ] Step 2: Create shared library structure  
- [ ] Step 3: Set up TypeORM + PostgreSQL
- [ ] Step 4: Create base DTOs
- [ ] Step 5: Verify project builds

### PHASE 2: DATA PREP SERVICE (Steps 6-12)
- [ ] Step 6: Create Data Prep microservice scaffold
- [ ] Step 7: Implement column detection
- [ ] Step 8: Implement auto-mapping algorithm
- [ ] Step 9: Implement data normalization
- [ ] Step 10: Create REST endpoints
- [ ] Step 11: Add Swagger documentation
- [ ] Step 12: Test Data Prep service end-to-end

### PHASE 3: STATE MANAGER SERVICE (Steps 13-18)
- [ ] Step 13: Create State Manager scaffold
- [ ] Step 14: Create database entities
- [ ] Step 15: Implement transaction storage
- [ ] Step 16: Implement state persistence
- [ ] Step 17: Create REST endpoints
- [ ] Step 18: Test State Manager service

### PHASE 4: FIRST MATCHING SERVICE MT-01 (Steps 19-24)
- [ ] Step 19: Create MT-01 scaffold
- [ ] Step 20: Implement exact match algorithm
- [ ] Step 21: Add field profile awareness
- [ ] Step 22: Create REST endpoints
- [ ] Step 23: Test with sample data
- [ ] Step 24: Verify State Manager integration

### PHASE 5-10: Additional services (Steps 25-60)
[Detailed steps available in full guide]

## 🚦 START HERE: STEP 1

See full implementation guide in outputs folder for complete step-by-step instructions.

Each step includes:
- Exact commands to run
- Complete file contents
- Verification procedures
- Testing instructions
- Success criteria

**DO NOT SKIP AHEAD - Complete Step 1 first, verify it works, then proceed to Step 2**
