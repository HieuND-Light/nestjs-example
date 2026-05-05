import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { doubleCsrfProtection } from './config/csrf.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));
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
  const allowedOrigins = config
    .get<string | undefined>('ALLOWED_ORIGINS')
    ?.split(',') || ['null'];
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
      secret: config.get('SESSION_SECRET')!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.get('NODE_ENV') === 'production',
        httpOnly: true,
        maxAge: 3600000, //1h
      },
    }),
  );
  app.use(cookieParser(config.get('JWT_SECRET_KEY')));
  app.use(doubleCsrfProtection);
  app.enableShutdownHooks();
  await app.listen(config.get<number>('PORT') ?? 3000);
}

bootstrap().catch((error) => console.log(error));
