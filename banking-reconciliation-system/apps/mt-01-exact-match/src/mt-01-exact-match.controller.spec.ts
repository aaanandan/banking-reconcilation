import { Test, TestingModule } from '@nestjs/testing';
import { Mt01ExactMatchController } from './mt-01-exact-match.controller';
import { Mt01ExactMatchService } from './mt-01-exact-match.service';

describe('Mt01ExactMatchController', () => {
  let mt01ExactMatchController: Mt01ExactMatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt01ExactMatchController],
      providers: [Mt01ExactMatchService],
    }).compile();

    mt01ExactMatchController = app.get<Mt01ExactMatchController>(Mt01ExactMatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt01ExactMatchController.getHello()).toBe('Hello World!');
    });
  });
});
