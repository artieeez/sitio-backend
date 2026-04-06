import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

describe("Trips (e2e)", () => {
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

  async function seedSchool(title = "Escola") {
    const res = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title })
      .expect(201);
    return res.body.id as string;
  }

  it("lists trips only for the school in the path", async () => {
    const s1 = await seedSchool("S1");
    const s2 = await seedSchool("S2");
    const t1 = await request(app.getHttpServer())
      .post(`/api/schools/${s1}/trips`)
      .send({ title: "V1" })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/schools/${s2}/trips`)
      .send({ title: "V2" })
      .expect(201);

    const list1 = await request(app.getHttpServer())
      .get(`/api/schools/${s1}/trips`)
      .expect(200);
    expect(list1.body).toHaveLength(1);
    expect(list1.body[0].id).toBe(t1.body.id);

    const list2 = await request(app.getHttpServer())
      .get(`/api/schools/${s2}/trips`)
      .expect(200);
    expect(list2.body).toHaveLength(1);
    expect(list2.body[0].title).toBe("V2");
  });

  it("includeInactive=false hides inactive trips", async () => {
    const schoolId = await seedSchool();
    const t = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({ title: "Off" })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/trips/${t.body.id as string}`)
      .send({ active: false })
      .expect(200);

    const def = await request(app.getHttpServer())
      .get(`/api/schools/${schoolId}/trips`)
      .expect(200);
    expect(def.body).toHaveLength(0);

    const all = await request(app.getHttpServer())
      .get(`/api/schools/${schoolId}/trips`)
      .query({ includeInactive: "true" })
      .expect(200);
    expect(all.body).toHaveLength(1);
  });

  it("blocks POST passenger when trip is inactive (409)", async () => {
    const schoolId = await seedSchool();
    const t = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({ title: "T" })
      .expect(201);
    const tripId = t.body.id as string;
    await request(app.getHttpServer())
      .patch(`/api/trips/${tripId}`)
      .send({ active: false })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/trips/${tripId}/passengers`)
      .send({ fullName: "João" })
      .expect(409);
  });

  it("GET /api/trips/:id returns trip", async () => {
    const schoolId = await seedSchool();
    const t = await request(app.getHttpServer())
      .post(`/api/schools/${schoolId}/trips`)
      .send({ defaultExpectedAmountMinor: 10000 })
      .expect(201);
    const tripId = t.body.id as string;

    const got = await request(app.getHttpServer())
      .get(`/api/trips/${tripId}`)
      .expect(200);
    expect(got.body.schoolId).toBe(schoolId);
    expect(got.body.defaultExpectedAmountMinor).toBe(10000);
  });
});
