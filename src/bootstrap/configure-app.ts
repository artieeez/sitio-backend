import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { RedactingLoggingInterceptor } from "../common/interceptors/redacting-logging.interceptor";
import { PrismaService } from "../prisma/prisma.service";

function corsOrigin(): boolean | string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (process.env.NODE_ENV === "production") {
    return [];
  }
  return true;
}

export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: corsOrigin(),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  });
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
