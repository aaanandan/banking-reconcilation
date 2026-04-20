import { Test, TestingModule } from '@nestjs/testing';
import { Mt10CurrencyController } from './mt-10-currency.controller';
import { Mt10CurrencyService } from './mt-10-currency.service';

describe('Mt10CurrencyController', () => {
  let mt10CurrencyController: Mt10CurrencyController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt10CurrencyController],
      providers: [Mt10CurrencyService],
    }).compile();

    mt10CurrencyController = app.get<Mt10CurrencyController>(Mt10CurrencyController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt10CurrencyController.getHello()).toBe('Hello World!');
    });
  });
});
