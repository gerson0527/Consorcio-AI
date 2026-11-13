import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { metadatosPrivados } from "@/lib/metadatos";

import { crearRegla, guardarEntidad, subirPolitica } from "@/app/(dashboard)/entidades/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entidad = await prisma.entidad.findUnique({ where: { id }, select: { nombre: true } });
  const nombre = entidad?.nombre ?? "Entidad";
  return metadatosPrivados(
    `Política de ${nombre}`,
    `Versiones de la política y reglas de ${nombre}. La versión anterior se conserva al subir una nueva.`,
  );
}

export default async function DetalleEntidad({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; aviso?: string; version?: string }>;
}) {
  const usuario = await sesionActual();
  const { id } = await params;
  const consulta = await searchParams;
  const entidad = await prisma.entidad.findUnique({
    where: { id },
    include: {
      politicas: { orderBy: { version: "desc" }, include: { fragmentos: { orderBy: { orden: "asc" } } } },
      reglas: { orderBy: { creadaEn: "desc" } },
      calibraciones: { orderBy: { calculadaEn: "desc" }, take: 1 },
    },
  });
  if (!entidad) notFound();
  const seleccionada = entidad.politicas.find((politica) => String(politica.version) === consulta.version) ?? entidad.politicas[0];
  return (
    <main id="contenido" className="flex flex-col gap-6">
      <Link href="/entidades" className="text-sm text-muted-foreground">Volver a entidades</Link>
      <h1 className="text-2xl font-semibold">{entidad.nombre}</h1>
      {consulta.error ? <p className="text-sm text-destructive">No se pudo guardar. Revisa el archivo o la regla.</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[12px] border bg-card p-4">
          <h2 className="font-medium">Versiones</h2>
          {entidad.politicas.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No hay políticas.</p> : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {entidad.politicas.map((politica) => (
                <li key={politica.id}>
                  <Link href={`/entidades/${entidad.id}?version=${politica.version}`} className="text-primary">
                    Versión {politica.version} {politica.vigente ? "(vigente)" : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {seleccionada ? (
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-[12px] bg-muted p-3 text-xs">
              {seleccionada.fragmentos.map((fragmento) => `p.${fragmento.pagina ?? "?"} ${fragmento.seccion ?? ""}\n${fragmento.texto}`).join("\n\n")}
            </pre>
          ) : null}
          {puede(usuario.rol, "subir_politica") ? (
            <form action={subirPolitica} className="mt-4 grid gap-3">
              <input type="hidden" name="entidadId" value={entidad.id} />
              <Input name="archivo" type="file" required className="h-11" />
              <Button type="submit" variant="outline">Subir política nueva</Button>
            </form>
          ) : null}
        </section>
        <section className="rounded-[12px] border bg-card p-4">
          <h2 className="font-medium">Reglas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Aprobación real: {entidad.calibraciones[0] && entidad.calibraciones[0].muestras >= 30
              ? `${Math.round(entidad.calibraciones[0].aprobacionReal * 100)} %`
              : "sin muestras suficientes"}
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {entidad.reglas.map((regla) => (
              <li key={regla.id}>{regla.campo} {regla.operador} {JSON.stringify(regla.valor)} · {regla.estado}</li>
            ))}
          </ul>
          {puede(usuario.rol, "editar_reglas") ? (
            <form action={crearRegla} className="mt-4 grid gap-2">
              <input type="hidden" name="entidadId" value={entidad.id} />
              <Input name="campo" placeholder="ingresoMensual" required className="h-11" />
              <select name="operador" className="h-11 rounded-[12px] border px-3">
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="==">==</option>
                <option value="in">in</option>
                <option value="between">between</option>
              </select>
              <Input name="valor" placeholder="2000000 o [&quot;FIJO&quot;]" required className="h-11" />
              <Input name="mensaje" placeholder="Mensaje para el analista" required className="h-11" />
              <select name="tipoCredito" className="h-11 rounded-[12px] border px-3">
                <option value="">Cualquier crédito</option>
                <option value="LIBRANZA">Libranza</option>
                <option value="CONSUMO">Consumo</option>
                <option value="VEHICULO">Vehículo</option>
                <option value="VIVIENDA">Vivienda</option>
              </select>
              <Button type="submit">Guardar regla</Button>
            </form>
          ) : null}
          {puede(usuario.rol, "editar_entidades") ? (
            <form action={guardarEntidad} className="mt-4 grid gap-2">
              <input type="hidden" name="id" value={entidad.id} />
              <Input name="nombre" defaultValue={entidad.nombre} className="h-11" />
              <select name="tipo" defaultValue={entidad.tipo} className="h-11 rounded-[12px] border px-3">
                <option value="BANCO">Banco</option>
                <option value="FINANCIERA">Financiera</option>
                <option value="COOPERATIVA">Cooperativa</option>
              </select>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="activa" defaultChecked={entidad.activa} /> Activa
              </label>
              <Button type="submit" variant="outline">Guardar entidad</Button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
