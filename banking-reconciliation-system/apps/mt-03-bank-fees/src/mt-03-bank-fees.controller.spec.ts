import { Test, TestingModule } from '@nestjs/testing';
import { Mt03BankFeesController } from './mt-03-bank-fees.controller';
import { Mt03BankFeesService } from './mt-03-bank-fees.service';

describe('Mt03BankFeesController', () => {
  let mt03BankFeesController: Mt03BankFeesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt03BankFeesController],
      providers: [Mt03BankFeesService],
    }).compile();

    mt03BankFeesController = app.get<Mt03BankFeesController>(Mt03BankFeesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt03BankFeesController.getHello()).toBe('Hello World!');
    });
  });
});
