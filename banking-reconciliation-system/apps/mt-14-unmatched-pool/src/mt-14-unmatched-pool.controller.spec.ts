import { Test, TestingModule } from '@nestjs/testing';
import { Mt14UnmatchedPoolController } from './mt-14-unmatched-pool.controller';
import { Mt14UnmatchedPoolService } from './mt-14-unmatched-pool.service';

describe('Mt14UnmatchedPoolController', () => {
  let mt14UnmatchedPoolController: Mt14UnmatchedPoolController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt14UnmatchedPoolController],
      providers: [Mt14UnmatchedPoolService],
    }).compile();

    mt14UnmatchedPoolController = app.get<Mt14UnmatchedPoolController>(Mt14UnmatchedPoolController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt14UnmatchedPoolController.getHello()).toBe('Hello World!');
    });
  });
});
