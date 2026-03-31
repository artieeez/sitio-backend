import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('HTTP (integration)', () => {
  let app: INestApplication;
  const previousDisableSimulation = process.env.DISABLE_LOCAL_AUTH_PROXY_SIMULATION;
  const prismaMock = {
    school: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Escola Teste',
          externalRef: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
    trip: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    passenger: { findUnique: jest.fn(), findMany: jest.fn() },
    paymentRecord: { findMany: jest.fn().mockResolvedValue([]) },
    shareLink: { findUnique: jest.fn() },
    flag: { create: jest.fn() },
    staff: { upsert: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn: (p: typeof prismaMock) => Promise<unknown>) =>
      fn(prismaMock),
    ),
  };

  beforeAll(async () => {
    process.env.DISABLE_LOCAL_AUTH_PROXY_SIMULATION = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (previousDisableSimulation === undefined) {
      delete process.env.DISABLE_LOCAL_AUTH_PROXY_SIMULATION;
    } else {
      process.env.DISABLE_LOCAL_AUTH_PROXY_SIMULATION = previousDisableSimulation;
    }
  });

  it('GET /v1/schools returns 401 without proxy user', () => {
    return request(app.getHttpServer()).get('/v1/schools').expect(401);
  });

  it('GET /v1/schools returns schools with proxy headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/schools')
      .set('x-auth-user-id', 'staff-1')
      .set('x-auth-user-name', 'Staff Test')
      .expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('Escola Teste');
  });
});
