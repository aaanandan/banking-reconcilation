import { Test, TestingModule } from '@nestjs/testing';
import { Mt08ReversalsController } from './mt-08-reversals.controller';
import { Mt08ReversalsService } from './mt-08-reversals.service';

describe('Mt08ReversalsController', () => {
  let mt08ReversalsController: Mt08ReversalsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt08ReversalsController],
      providers: [Mt08ReversalsService],
    }).compile();

    mt08ReversalsController = app.get<Mt08ReversalsController>(Mt08ReversalsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt08ReversalsController.getHello()).toBe('Hello World!');
    });
  });
});
