import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

const CPF_A = "11144477735";

describe("Manual paid without info (e2e)", () => {
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

  async function seedPassenger() {
    const school = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Escola" })
      .expect(201);
    const schoolId = school.body.id as string;
    const trip = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({ title: "Viagem", defaultExpectedAmountMinor: 5000 })
      .expect(201);
    const tripId = trip.body.id as string;
    const passenger = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Maria", cpf: CPF_A })
      .expect(201);
    return { tripId, passengerId: passenger.body.id as string };
  }

  it("PUT enables manual tag and returns settled_manual; clearing restores pending when underpaid", async () => {
    const { tripId, passengerId } = await seedPassenger();

    const on = await request(app.getHttpServer())
      .put(`/api/passengers/${passengerId}/manual-paid-without-info`)
      .send({ enabled: true })
      .expect(200);

    expect(on.body.status).toBe("settled_manual");
    expect(on.body.manualPaidWithoutInfo).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 2000,
        paidOn: "2026-04-01",
        location: "Loja",
        payerIdentity: "Ana",
      })
      .expect(201);

    const listMid = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    const row = listMid.body.find((p: { id: string }) => p.id === passengerId);
    expect(row.status).toBe("settled_manual");

    const off = await request(app.getHttpServer())
      .put(`/api/passengers/${passengerId}/manual-paid-without-info`)
      .send({ enabled: false })
      .expect(200);

    expect(off.body.manualPaidWithoutInfo).toBe(false);
    expect(off.body.status).toBe("pending");
  });

  it("with payments covering expected, clearing manual leaves settled_payments", async () => {
    const { passengerId } = await seedPassenger();

    await request(app.getHttpServer())
      .put(`/api/passengers/${passengerId}/manual-paid-without-info`)
      .send({ enabled: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 5000,
        paidOn: "2026-04-02",
        location: "Banco",
        payerIdentity: "João",
      })
      .expect(201);

    const off = await request(app.getHttpServer())
      .put(`/api/passengers/${passengerId}/manual-paid-without-info`)
      .send({ enabled: false })
      .expect(200);

    expect(off.body.status).toBe("settled_payments");
  });
});
