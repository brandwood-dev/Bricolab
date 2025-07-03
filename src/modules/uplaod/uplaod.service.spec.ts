import { Test, TestingModule } from '@nestjs/testing';
import { UplaodService } from './uplaod.service';

describe('UplaodService', () => {
  let service: UplaodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UplaodService],
    }).compile();

    service = module.get<UplaodService>(UplaodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
