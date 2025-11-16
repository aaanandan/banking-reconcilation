import { Test, TestingModule } from '@nestjs/testing';
import { Mt09TimingDifferencesController } from './mt-09-timing-differences.controller';
import { Mt09TimingDifferencesService } from './mt-09-timing-differences.service';

describe('Mt09TimingDifferencesController', () => {
  let mt09TimingDifferencesController: Mt09TimingDifferencesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt09TimingDifferencesController],
      providers: [Mt09TimingDifferencesService],
    }).compile();

    mt09TimingDifferencesController = app.get<Mt09TimingDifferencesController>(Mt09TimingDifferencesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt09TimingDifferencesController.getHello()).toBe('Hello World!');
    });
  });
});
