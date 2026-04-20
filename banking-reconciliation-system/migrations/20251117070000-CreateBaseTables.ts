import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaseTables20251117070000 implements MigrationInterface {
  name = 'CreateBaseTables20251117070000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "passwordHash" varchar NOT NULL,
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create reconciliations table
    await queryRunner.query(`
      CREATE TABLE "reconciliations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" varchar NOT NULL,
        "userId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "status" varchar NOT NULL DEFAULT 'created',
        "currentStep" integer NOT NULL DEFAULT 0,
        "totalSteps" integer NOT NULL DEFAULT 16,
        "dateRangeIncludeAll" boolean NOT NULL DEFAULT true,
        "dateRangeFrom" date,
        "dateRangeTo" date,
        "totalBankTransactions" integer NOT NULL DEFAULT 0,
        "totalLedgerTransactions" integer NOT NULL DEFAULT 0,
        "matchedCount" integer NOT NULL DEFAULT 0,
        "unmatchedBankCount" integer NOT NULL DEFAULT 0,
        "unmatchedLedgerCount" integer NOT NULL DEFAULT 0,
        "stagedMatchesCount" integer NOT NULL DEFAULT 0,
        "convergenceRate" numeric(5,2) NOT NULL DEFAULT 0,
        "currentAlgorithm" varchar,
        "fieldProfile" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_reconciliations_reconciliationId" UNIQUE ("reconciliationId"),
        CONSTRAINT "PK_reconciliations_id" PRIMARY KEY ("id")
      )
    `);

    // Create bank_files table
    await queryRunner.query(`
      CREATE TABLE "bank_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "bankId" varchar NOT NULL,
        "bankName" varchar NOT NULL,
        "fileName" varchar NOT NULL,
        "fileSize" integer NOT NULL,
        "rowCount" integer NOT NULL,
        "dateRangeFrom" date,
        "dateRangeTo" date,
        "columnMapping" jsonb,
        "uploadedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bank_files_id" PRIMARY KEY ("id")
      )
    `);

    // Create ledger_files table
    await queryRunner.query(`
      CREATE TABLE "ledger_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "fileName" varchar NOT NULL,
        "fileSize" integer NOT NULL,
        "rowCount" integer NOT NULL,
        "dateRangeFrom" date,
        "dateRangeTo" date,
        "columnMapping" jsonb,
        "uploadedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledger_files_id" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "source" varchar NOT NULL,
        "bankId" varchar,
        "bankName" varchar,
        "date" date NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "description" text NOT NULL,
        "status" varchar NOT NULL DEFAULT 'unmatched',
        "optionalFields" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id")
      )
    `);

    // Create match_candidates table
    await queryRunner.query(`
      CREATE TABLE "match_candidates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "bankTxnId" uuid NOT NULL,
        "ledgerTxnId" uuid NOT NULL,
        "matchType" varchar NOT NULL,
        "algorithm" varchar NOT NULL,
        "confidence" numeric(5,4) NOT NULL,
        "reasoning" text NOT NULL,
        "coreScore" numeric(5,4),
        "additionalScore" numeric(5,4),
        "fieldScoreBreakdown" jsonb,
        "userDecision" varchar,
        "decidedBy" uuid,
        "decidedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_candidates_id" PRIMARY KEY ("id")
      )
    `);

    // Create entity_profiles table
    await queryRunner.query(`
      CREATE TABLE "entity_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "entityName" varchar NOT NULL,
        "entityType" varchar NOT NULL,
        "identityInfo" jsonb,
        "businessPatterns" jsonb,
        "seasonalityInfo" jsonb,
        "bankBehavior" jsonb,
        "lastSeenDate" date,
        "transactionCount" integer NOT NULL DEFAULT 0,
        "averageAmount" numeric(15,2),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entity_profiles_id" PRIMARY KEY ("id")
      )
    `);

    // Create learning_questions table
    await queryRunner.query(`
      CREATE TABLE "learning_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "questionType" varchar NOT NULL,
        "questionText" text NOT NULL,
        "context" jsonb,
        "status" varchar NOT NULL DEFAULT 'pending',
        "answer" text,
        "answeredBy" uuid,
        "answeredAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_learning_questions_id" PRIMARY KEY ("id")
      )
    `);

    // Create convergence_metrics table
    await queryRunner.query(`
      CREATE TABLE "convergence_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "iteration" integer NOT NULL,
        "algorithm" varchar NOT NULL,
        "matchRate" numeric(5,2) NOT NULL,
        "newMatches" integer NOT NULL,
        "confidence" numeric(5,4) NOT NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_convergence_metrics_id" PRIMARY KEY ("id")
      )
    `);

    // Create user_feedback table
    await queryRunner.query(`
      CREATE TABLE "user_feedback" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reconciliationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "transactionId" uuid,
        "matchCandidateId" uuid,
        "feedbackType" varchar NOT NULL,
        "feedbackData" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_feedback_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_reconciliations_userId" ON "reconciliations" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reconciliations_reconciliationId" ON "reconciliations" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_bank_files_reconciliationId" ON "bank_files" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_ledger_files_reconciliationId" ON "ledger_files" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_reconciliationId" ON "transactions" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_source" ON "transactions" ("source")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_bankId" ON "transactions" ("bankId")`);
    await queryRunner.query(`CREATE INDEX "IDX_match_candidates_reconciliationId" ON "match_candidates" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_match_candidates_bankTxnId" ON "match_candidates" ("bankTxnId")`);
    await queryRunner.query(`CREATE INDEX "IDX_match_candidates_ledgerTxnId" ON "match_candidates" ("ledgerTxnId")`);
    await queryRunner.query(`CREATE INDEX "IDX_entity_profiles_reconciliationId" ON "entity_profiles" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_learning_questions_reconciliationId" ON "learning_questions" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_convergence_metrics_reconciliationId" ON "convergence_metrics" ("reconciliationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_feedback_reconciliationId" ON "user_feedback" ("reconciliationId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "user_feedback"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "convergence_metrics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "match_candidates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ledger_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reconciliations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
