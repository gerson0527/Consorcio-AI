import { salir } from "@/app/(auth)/login/acciones";
import { BarraIzquierda, Marco } from "@/components/paneles-trabajo";
import { rolLegible } from "@/components/presentacion";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

const enlaces = [
  { href: "/clientes", etiqueta: "Clientes", accion: "ver_clientes" as const },
  { href: "/entidades", etiqueta: "Entidades", accion: "ver_entidades" as const },
  { href: "/reglas", etiqueta: "Reglas sugeridas", accion: "aprobar_reglas" as const },
  { href: "/reportes", etiqueta: "Reportes", accion: "ver_reportes" as const },
  { href: "/auditoria", etiqueta: "Auditoría", accion: "ver_auditoria" as const },
];

export async function EspacioTrabajo({ children }: { children: React.ReactNode }) {
  const usuario = await sesionActual();
  const pendientes = puede(usuario.rol, "aprobar_reglas")
    ? await prisma.regla.count({ where: { estado: "PENDIENTE" } })
    : 0;
  const visibles = enlaces
    .filter((enlace) => puede(usuario.rol, enlace.accion))
    .map(({ href, etiqueta }) => ({ href, etiqueta }));

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-2 md:h-14 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="shrink-0 text-xs font-semibold md:text-base">Consorcio AI</p>
          <p className="hidden text-xs text-muted-foreground lg:inline">Preanálisis crediticio</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="hidden text-xs text-muted-foreground sm:inline">Sesión: {rolLegible(usuario.rol)}</p>
          <form action={salir}>
            <button type="submit" className="inline-flex h-11 items-center px-2 text-xs text-foreground md:h-8">
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <BarraIzquierda enlaces={visibles} pendientes={pendientes} />
        <Marco>{children}</Marco>
      </div>
    </div>
  );
}
