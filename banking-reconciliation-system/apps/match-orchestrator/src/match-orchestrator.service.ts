import { Injectable } from '@nestjs/common';

/**
 * Match Orchestrator Service
 *
 * Coordinates the sequential execution of matching algorithms:
 * 1. MT-01 (Exact Match) - finds exact matches first
 * 2. MT-02 (Fuzzy Match) - processes remaining unmatched transactions
 *
 * Aggregates results and provides unified statistics across all banks.
 */
@Injectable()
export class MatchOrchestratorService {
  // Service methods will be implemented in subsequent steps
}
