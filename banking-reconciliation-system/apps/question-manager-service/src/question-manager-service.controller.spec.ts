import { Test, TestingModule } from '@nestjs/testing';
import { QuestionManagerServiceController } from './question-manager-service.controller';
import { QuestionManagerServiceService } from './question-manager-service.service';

describe('QuestionManagerServiceController', () => {
  let questionManagerServiceController: QuestionManagerServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QuestionManagerServiceController],
      providers: [QuestionManagerServiceService],
    }).compile();

    questionManagerServiceController = app.get<QuestionManagerServiceController>(QuestionManagerServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(questionManagerServiceController.getHello()).toBe('Hello World!');
    });
  });
});
