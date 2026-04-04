import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { RedactingLoggingInterceptor } from "../common/interceptors/redacting-logging.interceptor";
import { PrismaService } from "../prisma/prisma.service";

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RedactingLoggingInterceptor());

  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);
}
