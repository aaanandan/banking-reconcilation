import { Test, TestingModule } from '@nestjs/testing';
import { MatchOrchestratorController } from './match-orchestrator.controller';
import { MatchOrchestratorService } from './match-orchestrator.service';

describe('MatchOrchestratorController', () => {
  let matchOrchestratorController: MatchOrchestratorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MatchOrchestratorController],
      providers: [MatchOrchestratorService],
    }).compile();

    matchOrchestratorController = app.get<MatchOrchestratorController>(MatchOrchestratorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(matchOrchestratorController.getHello()).toBe('Hello World!');
    });
  });
});
