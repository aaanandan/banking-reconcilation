import { Test, TestingModule } from '@nestjs/testing';
import { Mt12HighVolumePayerController } from './mt-12-high-volume-payer.controller';
import { Mt12HighVolumePayerService } from './mt-12-high-volume-payer.service';

describe('Mt12HighVolumePayerController', () => {
  let mt12HighVolumePayerController: Mt12HighVolumePayerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt12HighVolumePayerController],
      providers: [Mt12HighVolumePayerService],
    }).compile();

    mt12HighVolumePayerController = app.get<Mt12HighVolumePayerController>(Mt12HighVolumePayerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt12HighVolumePayerController.getHello()).toBe('Hello World!');
    });
  });
});
