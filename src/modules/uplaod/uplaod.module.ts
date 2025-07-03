import { Module } from '@nestjs/common';
import { UplaodService } from './uplaod.service';

@Module({
  providers: [UplaodService],
  exports: [UplaodService],
})
export class UplaodModule {}
