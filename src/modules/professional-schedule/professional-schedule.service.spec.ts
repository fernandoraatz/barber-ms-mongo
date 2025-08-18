import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalScheduleService } from './professional-schedule.service';

describe('ProfessionalScheduleService', () => {
  let service: ProfessionalScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfessionalScheduleService],
    }).compile();

    service = module.get<ProfessionalScheduleService>(ProfessionalScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
