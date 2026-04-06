import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

const CPF_A = "11144477735";

describe("Payments (e2e)", () => {
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
      .send({ title: "Viagem", defaultExpectedAmountMinor: 10_000 })
      .expect(201);
    const tripId = trip.body.id as string;
    const passenger = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Maria", cpf: CPF_A })
      .expect(201);
    return {
      tripId,
      passengerId: passenger.body.id as string,
    };
  }

  it("POST/GET payments for passenger; sorted by paidOn", async () => {
    const { passengerId } = await seedPassenger();

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 3000,
        paidOn: "2026-02-01",
        location: "Banco",
        payerIdentity: "João",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 2000,
        paidOn: "2026-01-15",
        location: "Loja",
        payerIdentity: "Ana",
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/passengers/${passengerId}/payments`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body).toHaveLength(2);
    expect(list.body[0].paidOn).toBe("2026-01-15");
    expect(list.body[1].paidOn).toBe("2026-02-01");
    expect(list.body[0].amountMinor).toBe(2000);
  });

  it("PATCH /payments/{id} updates record; passengerId not in body", async () => {
    const { passengerId } = await seedPassenger();
    const created = await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 1000,
        paidOn: "2026-03-01",
        location: "A",
        payerIdentity: "B",
      })
      .expect(201);
    const paymentId = created.body.id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/api/payments/${paymentId}`)
      .send({
        amountMinor: 1500,
        paidOn: "2026-03-02",
        location: "A2",
        payerIdentity: "B2",
      })
      .expect(200);

    expect(updated.body.passengerId).toBe(passengerId);
    expect(updated.body.amountMinor).toBe(1500);
    expect(updated.body.location).toBe("A2");
  });

  it("DELETE /payments/{id} returns 204", async () => {
    const { passengerId } = await seedPassenger();
    const created = await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 500,
        paidOn: "2026-04-01",
        location: "X",
        payerIdentity: "Y",
      })
      .expect(201);
    const paymentId = created.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/payments/${paymentId}`)
      .expect(204);

    const list = await request(app.getHttpServer())
      .get(`/api/passengers/${passengerId}/payments`)
      .expect(200);
    expect(list.body).toHaveLength(0);
  });

  it("blocks payment create when passenger is soft-removed (409)", async () => {
    const { passengerId } = await seedPassenger();
    await request(app.getHttpServer())
      .patch(`/api/passengers/${passengerId}`)
      .send({ removed: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/passengers/${passengerId}/payments`)
      .send({
        amountMinor: 100,
        paidOn: "2026-05-01",
        location: "Z",
        payerIdentity: "W",
      })
      .expect(409);
  });
});
