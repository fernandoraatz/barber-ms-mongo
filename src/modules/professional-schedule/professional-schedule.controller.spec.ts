import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalScheduleController } from './professional-schedule.controller';

describe('ProfessionalScheduleController', () => {
  let controller: ProfessionalScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalScheduleController],
    }).compile();

    controller = module.get<ProfessionalScheduleController>(ProfessionalScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
