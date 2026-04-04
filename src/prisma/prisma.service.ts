import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Wire Nest shutdown to Prisma disconnect (Nest + Prisma recipe). */
  enableShutdownHooks(app: { close: () => Promise<void> }): void {
    process.once("beforeExit", async () => {
      await app.close();
    });
  }
}
