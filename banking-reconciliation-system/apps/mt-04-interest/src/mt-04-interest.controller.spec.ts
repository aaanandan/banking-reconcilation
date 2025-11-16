import { Test, TestingModule } from '@nestjs/testing';
import { Mt04InterestController } from './mt-04-interest.controller';
import { Mt04InterestService } from './mt-04-interest.service';

describe('Mt04InterestController', () => {
  let mt04InterestController: Mt04InterestController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt04InterestController],
      providers: [Mt04InterestService],
    }).compile();

    mt04InterestController = app.get<Mt04InterestController>(Mt04InterestController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt04InterestController.getHello()).toBe('Hello World!');
    });
  });
});
