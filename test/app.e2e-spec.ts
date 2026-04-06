import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "./../src/app.module";
import { configureApp } from "./../src/bootstrap/configure-app";
import { PrismaService } from "./../src/prisma/prisma.service";
import { prismaServiceMock } from "./prisma-service.mock";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it("/api (GET)", () => {
    return request(app.getHttpServer())
      .get("/api")
      .expect(200)
      .expect("Hello World!");
  });

  afterEach(async () => {
    await app.close();
  });
});
