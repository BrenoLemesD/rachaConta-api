import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoriasPadrao = [
  { nome: "Viagem", icone: "viagem", cor: "#2563EB" },
  { nome: "Bar", icone: "bar", cor: "#D97706" },
  { nome: "Restaurante", icone: "restaurante", cor: "#DC2626" },
  { nome: "iFood", icone: "ifood", cor: "#EA1D2C" },
];

async function main() {
  for (const categoria of categoriasPadrao) {
    const existente = await prisma.categoria.findFirst({
      where: { sistema: true, nome: { equals: categoria.nome, mode: "insensitive" } },
    });

    if (!existente) {
      await prisma.categoria.create({
        data: { ...categoria, sistema: true, arquivada: false },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
