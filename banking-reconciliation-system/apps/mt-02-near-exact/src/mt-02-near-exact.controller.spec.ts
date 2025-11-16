import { Test, TestingModule } from '@nestjs/testing';
import { Mt02NearExactController } from './mt-02-near-exact.controller';
import { Mt02NearExactService } from './mt-02-near-exact.service';

describe('Mt02NearExactController', () => {
  let mt02NearExactController: Mt02NearExactController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt02NearExactController],
      providers: [Mt02NearExactService],
    }).compile();

    mt02NearExactController = app.get<Mt02NearExactController>(Mt02NearExactController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt02NearExactController.getHello()).toBe('Hello World!');
    });
  });
});
