import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { metadatosPrivados } from "@/lib/metadatos";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { confirmarCsv } from "@/app/(dashboard)/reglas/acciones";
import { Button } from "@/components/ui/button";
import { exigirAccion } from "@/lib/sesion";
import { parsearCsvResultados } from "@/modules/reportes";

export const metadata: Metadata = metadatosPrivados(
  "Vista previa de la importación",
  "Revisa las filas válidas y los errores del histórico antes de confirmar la carga en la plataforma.",
);

export default async function Importacion() {
  const usuario = await exigirAccion("importar_historico");
  let resultado: ReturnType<typeof parsearCsvResultados>;
  try {
    const texto = await readFile(path.join(process.cwd(), ".data", "importaciones", `${usuario.id}.json`), "utf8");
    resultado = JSON.parse(texto) as ReturnType<typeof parsearCsvResultados>;
  } catch {
    redirect("/reportes?error=archivo");
  }
  return (
    <main id="contenido" className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Vista previa de la importación</h1>
      <p className="text-sm">{resultado.validas.length} filas válidas y {resultado.errores.length} con error. Las filas con error no se cargan.</p>
      {resultado.errores.length === 0 ? null : (
        <ul className="rounded-[12px] border bg-warning-muted p-4 text-sm">
          {resultado.errores.map((error) => <li key={`${error.linea}-${error.mensaje}`}>Línea {error.linea}: {error.mensaje}</li>)}
        </ul>
      )}
      {resultado.validas.length === 0 ? <p>No hay filas para confirmar.</p> : (
        <form action={confirmarCsv}>
          <Button type="submit">Confirmar importación</Button>
        </form>
      )}
    </main>
  );
}
