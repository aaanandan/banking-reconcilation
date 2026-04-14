import { Test, TestingModule } from '@nestjs/testing';
import { StateManagerServiceController } from './state-manager-service.controller';
import { StateManagerServiceService } from './state-manager-service.service';

describe('StateManagerServiceController', () => {
  let stateManagerServiceController: StateManagerServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [StateManagerServiceController],
      providers: [StateManagerServiceService],
    }).compile();

    stateManagerServiceController = app.get<StateManagerServiceController>(StateManagerServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(stateManagerServiceController.getHello()).toBe('Hello World!');
    });
  });
});
