import { Test, TestingModule } from '@nestjs/testing';
import { Mt15ManualClassificationController } from './mt-15-manual-classification.controller';
import { Mt15ManualClassificationService } from './mt-15-manual-classification.service';

describe('Mt15ManualClassificationController', () => {
  let mt15ManualClassificationController: Mt15ManualClassificationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt15ManualClassificationController],
      providers: [Mt15ManualClassificationService],
    }).compile();

    mt15ManualClassificationController = app.get<Mt15ManualClassificationController>(Mt15ManualClassificationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt15ManualClassificationController.getHello()).toBe('Hello World!');
    });
  });
});
