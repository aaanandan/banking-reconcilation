import { Test, TestingModule } from '@nestjs/testing';
import { Mt13StandingOrdersController } from './mt-13-standing-orders.controller';
import { Mt13StandingOrdersService } from './mt-13-standing-orders.service';

describe('Mt13StandingOrdersController', () => {
  let mt13StandingOrdersController: Mt13StandingOrdersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Mt13StandingOrdersController],
      providers: [Mt13StandingOrdersService],
    }).compile();

    mt13StandingOrdersController = app.get<Mt13StandingOrdersController>(Mt13StandingOrdersController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(mt13StandingOrdersController.getHello()).toBe('Hello World!');
    });
  });
});
