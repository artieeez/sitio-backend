import type { PrismaService } from "../src/prisma/prisma.service";

/** Avoids a real DB TCP handshake in e2e that only exercise HTTP layers. */
export const prismaServiceMock: Pick<
  PrismaService,
  | "onModuleInit"
  | "onModuleDestroy"
  | "enableShutdownHooks"
  | "$connect"
  | "$disconnect"
> = {
  onModuleInit: async () => {},
  onModuleDestroy: async () => {},
  enableShutdownHooks: () => {},
  $connect: async () => {},
  $disconnect: async () => {},
};
