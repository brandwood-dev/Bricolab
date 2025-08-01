import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { UplaodModule } from '../uplaod/uplaod.module';
import { MailerModule } from '../mailer/mailer.module';
import { AccountDeletionRequestRepository } from './account_deletion_requests.repository';

@Module({
  providers: [UsersService,UsersRepository, AccountDeletionRequestRepository],
  imports: [UplaodModule, MailerModule],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
