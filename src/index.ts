import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();

  app.listen(env.port, () => {
    console.log(`RachaConta API em http://localhost:${env.port}`);
  });
}

main().catch(async (error: unknown) => {
  console.error("Falha ao iniciar a API", error);
  await prisma.$disconnect();
  process.exit(1);
});
