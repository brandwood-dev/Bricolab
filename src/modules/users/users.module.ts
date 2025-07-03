import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { UplaodModule } from '../uplaod/uplaod.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  providers: [UsersService,UsersRepository],
  imports: [UplaodModule, MailerModule],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
