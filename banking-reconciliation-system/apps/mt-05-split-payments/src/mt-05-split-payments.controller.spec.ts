import { Test, TestingModule } from '@nestjs/testing';
import { Mt05SplitPaymentsController } from './mt-05-split-payments.controller';
import { Mt05SplitPaymentsService } from './mt-05-split-payments.service';

describe('Mt05SplitPaymentsController', () => {
  let mt05SplitPaymentsController: Mt05SplitPaymentsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt05SplitPaymentsController],
      providers: [Mt05SplitPaymentsService],
    }).compile();

    mt05SplitPaymentsController = app.get<Mt05SplitPaymentsController>(Mt05SplitPaymentsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt05SplitPaymentsController.getHello()).toBe('Hello World!');
    });
  });
});
