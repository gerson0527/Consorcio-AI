import { PrismaClient, TipoCredito, TipoEntidad } from "@prisma/client";

import { hashClave } from "../src/lib/claves";
import { fragmentarPolitica } from "../src/modules/conocimiento/fragmentar";
import { embeddingLocal, vectorSql } from "../src/modules/conocimiento/embedding";

const prisma = new PrismaClient();

const usuarios = [
  ["admin@ejemplo.local", "Administrador Ejemplo", "ADMIN"],
  ["analista@ejemplo.local", "Analista Ejemplo", "ANALISTA"],
  ["auditor@ejemplo.local", "Auditor Ejemplo", "AUDITOR"],
] as const;

const entidades: Array<[string, TipoEntidad, string]> = [
  [
    "Banco Ejemplo Andino",
    "BANCO",
    "La edad mínima es 18 años y la máxima es 70.\n--- pagina 2 ---\n## Ingresos\nEl ingreso mensual mínimo de este ejemplo es 2000000.",
  ],
  [
    "Financiera Ejemplo Pacífico",
    "FINANCIERA",
    "## Antigüedad\nEste ejemplo exige 18 meses de antigüedad laboral.",
  ],
  [
    "Cooperativa Ejemplo Central",
    "COOPERATIVA",
    "## Contrato\nSe aceptan contratos FIJO u OBRA LABOR.",
  ],
  [
    "Banco Ejemplo Caribe",
    "BANCO",
    "## Obligaciones\nLas obligaciones mensuales no deben superar el 40 por ciento del ingreso.",
  ],
];

async function main() {
  const passwordHash = await hashClave("Ejemplo.2026");
  for (const [email, nombre, rol] of usuarios) {
    await prisma.user.upsert({
      where: { email },
      update: { nombre, rol, passwordHash, activo: true },
      create: { email, nombre, rol, passwordHash },
    });
  }
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@ejemplo.local" },
  });

  for (const [nombre, tipo, texto] of entidades) {
    const entidad = await prisma.entidad.upsert({
      where: { nombre },
      update: { tipo, activa: true },
      create: { nombre, tipo },
    });
    const ya = await prisma.politica.findFirst({ where: { entidadId: entidad.id } });
    if (!ya) {
      const politica = await prisma.politica.create({
        data: {
          entidadId: entidad.id,
          version: 1,
          archivoKey: `ejemplos/${entidad.id}`,
          vigente: true,
          subidaPorId: admin.id,
          fragmentos: {
            create: fragmentarPolitica(
              `# EJEMPLO, no es una política real\n${texto}`,
            ).map((fragmento) => ({
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
          await prisma.$executeRaw`
            UPDATE "Fragmento" SET embedding = ${vectorSql(embeddingLocal(fragmento.texto))}::vector
            WHERE id = ${fragmento.id}
          `;
        } catch {
          console.info(`Sin pgvector para ${nombre}. La búsqueda usará el texto.`);
        }
      }
    }
    const reglas = await prisma.regla.count({ where: { entidadId: entidad.id } });
    if (reglas === 0) {
      await prisma.regla.createMany({
        data: [
          regla(
            entidad.id,
            "ingresoMensual",
            ">=",
            2_000_000,
            "Ingreso de ejemplo mínimo.",
          ),
          regla(
            entidad.id,
            "antiguedadLaboralMeses",
            ">=",
            nombre.includes("Pacífico") ? 18 : 12,
            "Antigüedad de ejemplo.",
          ),
          regla(entidad.id, "edad", "between", [18, 70], "Rango de edad de ejemplo."),
        ],
      });
    }
  }
  console.info("Datos de ejemplo listos. Contraseña de desarrollo: Ejemplo.2026");
}

function regla(
  entidadId: string,
  campo: string,
  operador: string,
  valor: unknown,
  mensaje: string,
) {
  return {
    entidadId,
    campo,
    operador,
    valor: valor as never,
    mensaje,
    tipoCredito: "CONSUMO" as TipoCredito,
    origen: "MANUAL" as const,
    estado: "ACTIVA" as const,
  };
}

main().finally(async () => {
  await prisma.$disconnect();
});
