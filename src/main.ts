import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { doubleCsrfProtection } from './config/csrf.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());
  const allowedOrigins = ['http://localhost:3000'];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        httpOnly: true,
        maxAge: 3600000, // 1 hour in milliseconds
      },
    }),
  );
  app.use(cookieParser(process.env.JWT_SECRET_KEY));
  app.use(doubleCsrfProtection);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => console.log(error));
