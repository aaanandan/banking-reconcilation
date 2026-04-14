import { Test, TestingModule } from '@nestjs/testing';
import { Mt11RoundingController } from './mt-11-rounding.controller';
import { Mt11RoundingService } from './mt-11-rounding.service';

describe('Mt11RoundingController', () => {
  let mt11RoundingController: Mt11RoundingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt11RoundingController],
      providers: [Mt11RoundingService],
    }).compile();

    mt11RoundingController = app.get<Mt11RoundingController>(Mt11RoundingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt11RoundingController.getHello()).toBe('Hello World!');
    });
  });
});
