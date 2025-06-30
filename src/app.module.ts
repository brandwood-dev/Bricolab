import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    MailerModule,
    ThrottlerModule.forRoot({
      throttlers: [
    {
      name: 'short',
      ttl: 60000,
      limit: 10,
    },
  ],
    }),
  ],
  controllers: [],
  providers: [{
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },],
})
export class AppModule {}
