import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reconciliation,
  BankFile,
  LedgerFile,
  Transaction,
  MatchCandidate,
} from '@app/shared';

/**
 * State Manager Service
 * Handles persistence of reconciliation state, transactions, and snapshots
 */
@Injectable()
export class StateManagerServiceService {
  constructor(
    @InjectRepository(Reconciliation)
    private readonly reconciliationRepo: Repository<Reconciliation>,
    @InjectRepository(BankFile)
    private readonly bankFileRepo: Repository<BankFile>,
    @InjectRepository(LedgerFile)
    private readonly ledgerFileRepo: Repository<LedgerFile>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(MatchCandidate)
    private readonly matchCandidateRepo: Repository<MatchCandidate>,
  ) {}

  // CRUD operations will be implemented in Steps 16-19
}
