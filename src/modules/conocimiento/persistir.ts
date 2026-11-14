import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { embeddingLocal, fragmentarPolitica, vectorSql } from "@/modules/conocimiento";

export async function guardarPolitica(entrada: {
  entidadId: string;
  texto: string;
  archivoKey: string;
  subidaPorId: string;
}) {
  const ultima = await prisma.politica.findFirst({
    where: { entidadId: entrada.entidadId },
    orderBy: { version: "desc" },
  });
  await prisma.politica.updateMany({
    where: { entidadId: entrada.entidadId, vigente: true },
    data: { vigente: false },
  });
  const politica = await prisma.politica.create({
    data: {
      entidadId: entrada.entidadId,
      version: (ultima?.version ?? 0) + 1,
      archivoKey: entrada.archivoKey,
      vigente: true,
      subidaPorId: entrada.subidaPorId,
      fragmentos: {
        create: fragmentarPolitica(entrada.texto).map((fragmento) => ({
          orden: fragmento.orden,
          seccion: fragmento.seccion,
          pagina: fragmento.pagina,
          texto: fragmento.texto,
        })),
      },
    },
    include: { fragmentos: true },
  });
  for (const fragmento of politica.fragmentos) {
    try {
      const literal = vectorSql(embeddingLocal(fragmento.texto));
      await prisma.$executeRaw`
        UPDATE "Fragmento" SET embedding = ${literal}::vector WHERE id = ${fragmento.id}
      `;
    } catch {
      // La extensión vector se aplica cuando Postgres la tiene instalada.
    }
  }
  return politica;
}

export type PoliticaGuardada = Prisma.PoliticaGetPayload<{
  include: { fragmentos: true };
}>;
