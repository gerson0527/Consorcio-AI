import type { Metadata } from "next";
import Link from "next/link";

import { metadatosPrivados } from "@/lib/metadatos";

import { crearCliente } from "@/app/(dashboard)/clientes/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exigirAccion } from "@/lib/sesion";

export const metadata: Metadata = metadatosPrivados(
  "Nuevo cliente de preanálisis",
  "Registra un cliente con nombre, documento, tipo de crédito y el consentimiento para el preanálisis.",
);

export default async function NuevoCliente({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAccion("editar_clientes");
  const { error } = await searchParams;
  return (
    <main id="contenido" className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link href="/clientes" className="text-sm text-muted-foreground">
          Volver a clientes
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
      </div>
      <form action={crearCliente} className="flex flex-col gap-4 rounded-[12px] border bg-card p-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" required autoComplete="name" className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="documento">Documento de identidad</Label>
          <Input id="documento" name="documento" required inputMode="numeric" autoComplete="off" className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoCredito">Tipo de crédito</Label>
          <select id="tipoCredito" name="tipoCredito" className="h-11 rounded-[12px] border bg-card px-3">
            <option value="LIBRANZA">Libranza</option>
            <option value="CONSUMO">Consumo</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="VIVIENDA">Vivienda</option>
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="finalidad" required className="size-4" />
          Autoriza el preanálisis crediticio con la finalidad de comparar su perfil con políticas de entidades.
        </label>
        {error ? <p className="text-sm text-destructive">Revisa los datos. El consentimiento es obligatorio.</p> : null}
        <Button type="submit">Crear cliente</Button>
      </form>
    </main>
  );
}
