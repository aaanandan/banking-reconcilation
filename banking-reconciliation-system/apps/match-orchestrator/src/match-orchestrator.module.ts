import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MatchOrchestratorController } from './match-orchestrator.controller';
import { MatchOrchestratorService } from './match-orchestrator.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [MatchOrchestratorController],
  providers: [MatchOrchestratorService],
})
export class MatchOrchestratorModule {}
