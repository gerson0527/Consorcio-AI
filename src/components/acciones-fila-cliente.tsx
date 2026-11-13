"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { suprimirCliente } from "@/app/(dashboard)/clientes/acciones";
import { Button } from "@/components/ui/button";

export function AccionesFilaCliente({
  id,
  editar,
  eliminar,
}: {
  id: string;
  editar: boolean;
  eliminar: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {editar ? (
        <Button
          nativeButton={false}
          variant="outline"
          size="icon"
          className="bg-card"
          aria-label="Editar cliente"
          render={<Link href={`/clientes/${id}`} />}
        >
          <Pencil />
        </Button>
      ) : null}
      {eliminar ? (
        <form
          action={suprimirCliente}
          onSubmit={(evento) => {
            if (!window.confirm("¿Eliminar los datos de este cliente? Esta acción no se puede deshacer.")) {
              evento.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="destructive" size="icon" aria-label="Eliminar cliente">
            <Trash2 />
          </Button>
        </form>
      ) : null}
    </div>
  );
}
