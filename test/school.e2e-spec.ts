import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";
import { PrismaService } from "./../src/prisma/prisma.service";
import { createE2eApp, resetDatabase } from "./e2e-helpers";

describe("Schools (e2e)", () => {
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

  it("GET /api/schools returns empty list by default", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/schools")
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/schools creates and GET lists active school", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Escola Alpha" })
      .expect(201);
    expect(created.body.title).toBe("Escola Alpha");
    expect(created.body.active).toBe(true);

    const list = await request(app.getHttpServer())
      .get("/api/schools")
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.body.id);
  });

  it("PATCH /api/schools/:id updates fields", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Beta" })
      .expect(201);
    const id = created.body.id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/api/schools/${id}`)
      .send({ title: "Beta Atualizada", url: "https://example.org" })
      .expect(200);
    expect(updated.body.title).toBe("Beta Atualizada");
    expect(updated.body.url).toBe("https://example.org");
  });

  it("includeInactive=false hides inactive schools; includeInactive=true shows them", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Inativa" })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .patch(`/api/schools/${id}`)
      .send({ active: false })
      .expect(200);

    const def = await request(app.getHttpServer())
      .get("/api/schools")
      .expect(200);
    expect(def.body).toHaveLength(0);

    const all = await request(app.getHttpServer())
      .get("/api/schools")
      .query({ includeInactive: "true" })
      .expect(200);
    expect(all.body).toHaveLength(1);
    expect(all.body[0].active).toBe(false);
  });

  it("blocks POST /api/schools/:id/trips when school is inactive (409)", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Off" })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .patch(`/api/schools/${id}`)
      .send({ active: false })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/schools/${id}/trips`)
      .send({})
      .expect(409);
  });

  it("POST /api/schools/:id/deactivate sets active false (204)", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Soft" })
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/schools/${id}/deactivate`)
      .expect(204);

    const row = await prisma.school.findUnique({ where: { id } });
    expect(row?.active).toBe(false);
  });

  it("POST /api/schools/:id/activate sets active true (204)", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Re" })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/schools/${id}/deactivate`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/schools/${id}/activate`)
      .expect(204);

    const row = await prisma.school.findUnique({ where: { id } });
    expect(row?.active).toBe(true);
  });

  it("DELETE /api/schools/:id hard-deletes row (204)", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/schools")
      .send({ title: "Hard" })
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer()).delete(`/api/schools/${id}`).expect(204);

    const row = await prisma.school.findUnique({ where: { id } });
    expect(row).toBeNull();
  });
});
