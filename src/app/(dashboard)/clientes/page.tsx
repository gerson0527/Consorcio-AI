import type { Metadata } from "next";
import Link from "next/link";

import { metadatosPrivados } from "@/lib/metadatos";

import { AccionesFilaCliente } from "@/components/acciones-fila-cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MarcaEjemplo,
  Pastilla,
  creditoLegible,
  textoDocumentos,
} from "@/components/presentacion";
import { documentoEnmascarado, leerDatos } from "@/lib/campos";
import { estadoCaso } from "@/lib/estado-caso";
import { puede } from "@/lib/autorizacion";
import { filtroCasoPropio } from "@/lib/acceso-clientes";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";
import type { Perfil } from "@/modules/ingesta/perfil";

export const metadata: Metadata = metadatosPrivados(
  "Clientes del preanálisis crediticio",
  "Consulta los clientes en preanálisis, el avance de sus documentos, la mejor opción y el estado de cada caso.",
);

const campo =
  "h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

export default async function Clientes({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    tipo?: string;
    error?: string;
    aviso?: string;
  }>;
}) {
  const usuario = await sesionActual();
  const filtros = await searchParams;
  const filtroCaso = {
    ...filtroCasoPropio(usuario),
    ...(filtros.tipo ? { tipoCredito: filtros.tipo as never } : {}),
  };
  const esAdministrador = usuario.rol === "ADMIN";
  const [clientes, ejemplos] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        suprimidoEn: null,
        nombre: filtros.q ? { contains: filtros.q, mode: "insensitive" } : undefined,
        ...(Object.keys(filtroCaso).length > 0 ? { casos: { some: filtroCaso } } : {}),
      },
      include: {
        casos: {
          orderBy: { creadoEn: "desc" },
          take: 1,
          include: {
            analista: { select: { nombre: true } },
            documentos: true,
            evaluaciones: {
              orderBy: { ranking: "asc" },
              include: { entidad: true, resultado: true },
            },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.entidad.count({
      where: { nombre: { contains: "ejemplo", mode: "insensitive" } },
    }),
  ]);

  const puedeEditar = puede(usuario.rol, "editar_clientes");
  const puedeEliminar = puede(usuario.rol, "suprimir_datos");
  const conAcciones = puedeEditar || puedeEliminar;
  const columnas = 5 + Number(conAcciones) + Number(esAdministrador);

  const filas = clientes
    .map((cliente) => {
      const caso = cliente.casos[0];
      const perfil = leerDatos<Partial<Perfil>>(caso?.perfil) ?? {};
      const estado = estadoCaso({
        documentos: caso?.documentos.map((documento) => documento.estado) ?? [],
        revisar: (perfil.revisar?.length ?? 0) > 0,
        evaluaciones: caso?.evaluaciones.length ?? 0,
        conResultado:
          caso?.evaluaciones.some((evaluacion) => evaluacion.resultado) ?? false,
      });
      return { cliente, caso, estado, mejor: caso?.evaluaciones[0] };
    })
    .filter((fila) => !filtros.estado || fila.estado === filtros.estado);

  return (
    <main id="contenido" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Clientes</h1>
          {ejemplos > 0 ? <MarcaEjemplo /> : null}
        </div>
        {puede(usuario.rol, "editar_clientes") ? (
          <Button nativeButton={false} render={<Link href="/clientes/nuevo" />}>
            Nuevo cliente
          </Button>
        ) : null}
      </div>
      {filtros.error === "permiso" ? (
        <p className="text-sm text-destructive">No tienes permiso para esa acción.</p>
      ) : null}
      {filtros.aviso === "suprimido" ? (
        <p className="text-sm text-success">Los datos del cliente se suprimieron.</p>
      ) : null}
      <form className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm text-muted-foreground">
          Buscar cliente
          <Input
            name="q"
            defaultValue={filtros.q}
            placeholder="Nombre o documento"
            className="h-11 bg-card"
          />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground lg:w-44">
          Estado
          <select name="estado" defaultValue={filtros.estado ?? ""} className={campo}>
            <option value="">Todos</option>
            <option>Procesando</option>
            <option>Por revisar</option>
            <option>Resultado pendiente</option>
            <option>Evaluado</option>
          </select>
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground lg:w-44">
          Tipo de crédito
          <select name="tipo" defaultValue={filtros.tipo ?? ""} className={campo}>
            <option value="">Todos</option>
            <option value="LIBRANZA">Libranza</option>
            <option value="CONSUMO">Consumo</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="VIVIENDA">Vivienda</option>
          </select>
        </label>
        <Button type="submit" variant="outline" className="bg-card">
          Filtrar
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Cliente</th>
              {esAdministrador ? <th className="px-5 py-3 font-medium">Asesor</th> : null}
              <th className="px-5 py-3 font-medium">Crédito</th>
              <th className="px-5 py-3 font-medium">Documentos</th>
              <th className="px-5 py-3 font-medium">Mejor opción</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              {conAcciones ? (
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas} className="px-5 py-10 text-muted-foreground">
                  No hay clientes con esos filtros.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.cliente.id} className="border-b last:border-0">
                  <td className="px-5 py-4">
                    <Link
                      href={`/clientes/${fila.cliente.id}`}
                      className="font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      {fila.cliente.nombre}
                    </Link>
                    <p className="text-muted-foreground">
                      Doc. {documentoEnmascarado(fila.cliente.documentoCifrado)}
                    </p>
                  </td>
                  {esAdministrador ? (
                    <td className="px-5 py-4">
                      {fila.caso?.analista.nombre ?? "Sin asesor"}
                    </td>
                  ) : null}
                  <td className="px-5 py-4">{creditoLegible(fila.caso?.tipoCredito)}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {textoDocumentos(
                      fila.caso?.documentos.map((documento) => documento.estado) ?? [],
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {fila.mejor ? (
                      `${fila.mejor.entidad.nombre}${fila.mejor.probabilidad === null ? "" : ` · ${Math.round(fila.mejor.probabilidad * 100)} %`}`
                    ) : (
                      <span className="font-normal text-muted-foreground">
                        Sin evaluar
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Pastilla>{fila.estado}</Pastilla>
                  </td>
                  {conAcciones ? (
                    <td className="px-5 py-3 text-right">
                      <AccionesFilaCliente
                        id={fila.cliente.id}
                        editar={puedeEditar}
                        eliminar={puedeEliminar}
                      />
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
