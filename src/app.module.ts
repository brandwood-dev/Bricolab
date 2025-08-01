import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { UplaodModule } from './modules/uplaod/uplaod.module';
import { ToolsModule } from './modules/tools/tools.module';
import { FavoritesModule } from './modules/favorites/favorites.module';

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
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 1000, // 1000 requests per hour
        },
      ],
    }),
    UplaodModule,
    ToolsModule,
    FavoritesModule,
  ],
  controllers: [],
  providers: [{
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },],
})
export class AppModule {}
