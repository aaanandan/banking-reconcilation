import { Test, TestingModule } from '@nestjs/testing';
import { Mt16FinalValidationController } from './mt-16-final-validation.controller';
import { Mt16FinalValidationService } from './mt-16-final-validation.service';

describe('Mt16FinalValidationController', () => {
  let mt16FinalValidationController: Mt16FinalValidationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt16FinalValidationController],
      providers: [Mt16FinalValidationService],
    }).compile();

    mt16FinalValidationController = app.get<Mt16FinalValidationController>(Mt16FinalValidationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt16FinalValidationController.getHello()).toBe('Hello World!');
    });
  });
});
