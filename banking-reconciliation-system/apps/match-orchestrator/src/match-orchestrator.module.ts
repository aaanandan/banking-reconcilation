import { Module } from '@nestjs/common';
import { MatchOrchestratorController } from './match-orchestrator.controller';
import { MatchOrchestratorService } from './match-orchestrator.service';

@Module({
  imports: [],
  controllers: [MatchOrchestratorController],
  providers: [MatchOrchestratorService],
})
export class MatchOrchestratorModule {}
