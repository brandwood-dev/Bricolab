import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { ContactModule } from './modules/contact/contact.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { UplaodModule } from './modules/uplaod/uplaod.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BlogModule } from './modules/blog/blog.module';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailerModule,
    HealthModule,
    ContactModule,

    AuthModule,
    PrismaModule,
    UsersModule,
    MailerModule,
    ThrottlerModule.forRoot([]),
    UplaodModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),  
      serveRoot: '/uploads',                        
    }),
    BlogModule,
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/bricolab')

  ],
  controllers: [],
  providers: [{
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },],
})
export class AppModule {}
