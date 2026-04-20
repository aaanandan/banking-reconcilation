import { Test, TestingModule } from '@nestjs/testing';
import { Mt06ConsolidatedDepositsController } from './mt-06-consolidated-deposits.controller';
import { Mt06ConsolidatedDepositsService } from './mt-06-consolidated-deposits.service';

describe('Mt06ConsolidatedDepositsController', () => {
  let mt06ConsolidatedDepositsController: Mt06ConsolidatedDepositsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt06ConsolidatedDepositsController],
      providers: [Mt06ConsolidatedDepositsService],
    }).compile();

    mt06ConsolidatedDepositsController = app.get<Mt06ConsolidatedDepositsController>(Mt06ConsolidatedDepositsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt06ConsolidatedDepositsController.getHello()).toBe('Hello World!');
    });
  });
});
