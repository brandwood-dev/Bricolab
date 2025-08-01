import { Module } from '@nestjs/common';
import { UplaodService } from './uplaod.service';
import { UplaodController } from './uplaod.controller';

@Module({
  providers: [UplaodService],
  exports: [UplaodService],
  controllers: [UplaodController],
})
export class UplaodModule {}
