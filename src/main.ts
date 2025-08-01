import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.set('trust proxy', 'loopback');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
    const config = new DocumentBuilder()
    .setTitle('Bricolib API')
    .setDescription('API documentation for Bricolib')
    .setVersion('1.0')
    .addTag('bricolib')
    .build();
  app.enableCors({
    origin: 'http://localhost:8081', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, 
  });
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
