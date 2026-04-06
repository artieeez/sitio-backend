import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

/** Valid check-digit CPFs for integration tests */
const CPF_A = "11144477735";
const CPF_B = "52998224725";

describe("Passengers (e2e)", () => {
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

  async function seedTrip() {
    const school = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Escola" })
      .expect(201);
    const schoolId = school.body.id as string;
    const trip = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({ title: "Viagem", defaultExpectedAmountMinor: 5000 })
      .expect(201);
    return trip.body.id as string;
  }

  it("rejects invalid CPF (400)", async () => {
    const tripId = await seedTrip();
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "A", cpf: "123" })
      .expect(400);
  });

  it("blocks duplicate CPF on same trip (409)", async () => {
    const tripId = await seedTrip();
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Um", cpf: CPF_A })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Dois", cpf: CPF_A })
      .expect(409);
  });

  it("blocks duplicate CPF even when prior passenger is soft-removed (FR-031)", async () => {
    const tripId = await seedTrip();
    const first = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Removido", cpf: CPF_A })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/passengers/${first.body.id as string}`)
      .send({ removed: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Novo mesmo CPF", cpf: CPF_A })
      .expect(409);
  });

  it("returns 428 when name duplicates without confirm; succeeds with confirmNameDuplicate", async () => {
    const tripId = await seedTrip();
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Maria Silva" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "maria   silva" })
      .expect(428);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "MARIA SILVA", confirmNameDuplicate: true })
      .expect(201);
  });

  it("soft-remove and restore via PATCH; list respects includeRemoved", async () => {
    const tripId = await seedTrip();
    const p = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "Pedro", cpf: CPF_B })
      .expect(201);
    const passengerId = p.body.id as string;

    const defList = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    expect(defList.body).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/api/passengers/${passengerId}`)
      .send({ removed: true })
      .expect(200);

    const hidden = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    expect(hidden.body).toHaveLength(0);

    const shown = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .query({ includeRemoved: "true" })
      .expect(200);
    expect(shown.body).toHaveLength(1);
    expect(shown.body[0].removedAt).not.toBeNull();

    await request(app.getHttpServer())
      .patch(`/api/passengers/${passengerId}`)
      .send({ removed: false })
      .expect(200);

    const back = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}/passengers`)
      .expect(200);
    expect(back.body).toHaveLength(1);
    expect(back.body[0].removedAt).toBeNull();
  });

  it("enforces parent email format when provided", async () => {
    const tripId = await seedTrip();
    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({
        fullName: "Com email",
        parentEmail: "not-an-email",
      })
      .expect(400);
  });

  it("accepts parent contact fields", async () => {
    const tripId = await seedTrip();
    const res = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({
        fullName: "Filho",
        parentName: "Mãe",
        parentPhoneNumber: "+55 11 98888-7777",
        parentEmail: "mae@example.com",
      })
      .expect(201);
    expect(res.body.parentName).toBe("Mãe");
    expect(res.body.parentEmail).toBe("mae@example.com");
    expect(res.body.parentPhoneNumber).toBe("5511988887777");
  });

  it("derives paymentStatus unavailable without expected amount and no payments", async () => {
    const school = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "S" })
      .expect(201);
    const trip = await request(app.getHttpServer())
      .post(`/api/schools/${school.body.id as string}/trips`)
      .send({ title: "No default" })
      .expect(201);
    const tripId = trip.body.id as string;

    const p = await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "X" })
      .expect(201);
    expect(p.body.status).toBe("unavailable");
  });
});
