import { Test, TestingModule } from '@nestjs/testing';
import { Mt07DuplicatePostingsController } from './mt-07-duplicate-postings.controller';
import { Mt07DuplicatePostingsService } from './mt-07-duplicate-postings.service';

describe('Mt07DuplicatePostingsController', () => {
  let mt07DuplicatePostingsController: Mt07DuplicatePostingsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt07DuplicatePostingsController],
      providers: [Mt07DuplicatePostingsService],
    }).compile();

    mt07DuplicatePostingsController = app.get<Mt07DuplicatePostingsController>(Mt07DuplicatePostingsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt07DuplicatePostingsController.getHello()).toBe('Hello World!');
    });
  });
});
