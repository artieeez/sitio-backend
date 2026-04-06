import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

const CPF_A = "11144477735";
const CPF_B = "52998224725";

type StatusRow = { status: string };

function countByStatus(rows: StatusRow[]) {
  const m = {
    pending: 0,
    settled_payments: 0,
    settled_manual: 0,
    unavailable: 0,
  };
  for (const r of rows) {
    if (r.status in m) {
      m[r.status as keyof typeof m] += 1;
    }
  }
  return m;
}

describe("Passenger status aggregates (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await createE2eApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedTripWithExpectedAmount(defaultExpected: number | null) {
    const school = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Escola" })
      .expect(201);
    const schoolId = school.body.id as string;
    const trip = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({
        title: "Viagem",
        ...(defaultExpected != null
          ? { defaultExpectedAmountMinor: defaultExpected }
          : {}),
      })
      .expect(201);
    return trip.body.id as string;
  }

  it("aggregates match passenger list counts when includeRemoved=false", async () => {
    const tripId = await seedTripWithExpectedAmount(10_000);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "A", cpf: CPF_A })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "B", cpf: CPF_B })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    const agg = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passenger-status-aggregates`)
      .expect(200);

    const c = countByStatus(list.body as StatusRow[]);
    expect(agg.body.pendingCount).toBe(c.pending);
    expect(agg.body.settledPaymentsCount).toBe(c.settled_payments);
    expect(agg.body.settledManualCount).toBe(c.settled_manual);
    expect(agg.body.unavailableCount).toBe(c.unavailable);
  });

  it("includeRemoved excludes soft-removed passengers from aggregates by default", async () => {
    const tripId = await seedTripWithExpectedAmount(1000);

    const p1 = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Removido", cpf: CPF_A })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/passengers/${p1.body.id as string}`)
      .send({ removed: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Ativo", cpf: CPF_B })
      .expect(201);

    const def = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passenger-status-aggregates`)
      .expect(200);
    expect(def.body.pendingCount).toBe(1);

    const inc = await request(app.getHttpServer())
      .get(
        `/api/trips/${tripId}/passenger-status-aggregates?includeRemoved=true`,
      )
      .expect(200);
    expect(inc.body.pendingCount).toBe(2);
  });

  it("PATCH trip default amount changes derived passenger status (FR-019)", async () => {
    const tripId = await seedTripWithExpectedAmount(5000);

    const p = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Maria", cpf: CPF_A })
      .expect(201);
    const passengerId = p.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 3000,
        paidOn: "2026-04-01",
        location: "X",
        payerIdentity: "Y",
      })
      .expect(201);

    const mid = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    const row = (mid.body as { id: string; status: string }[]).find(
      (x) => x.id === passengerId,
    );
    expect(row?.status).toBe("pending");

    await request(app.getHttpServer())
      .patch(`/api/trips/${tripId}`)
      .send({ defaultExpectedAmountMinor: 2500 })
      .expect(200);

    const after = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    const row2 = (after.body as { id: string; status: string }[]).find(
      (x) => x.id === passengerId,
    );
    expect(row2?.status).toBe("settled_payments");
  });

  it("unavailable when no expected amount and no payments; manual + payments stays manual until cleared", async () => {
    const tripId = await seedTripWithExpectedAmount(null);

    const p = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Sem valor", cpf: CPF_A })
      .expect(201);
    const passengerId = p.body.id as string;

    const u = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    expect((u.body as { status: string }[])[0].status).toBe("unavailable");

    await request(app.getHttpServer())
      .put(`/api/passengers/${passengerId}/manual-paid-without-info`)
      .send({ enabled: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 500,
        paidOn: "2026-04-02",
        location: "Z",
        payerIdentity: "W",
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    expect((list.body as { status: string }[])[0].status).toBe(
      "settled_manual",
    );
  });
});
