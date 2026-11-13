"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BarraIzquierda({
  enlaces,
  pendientes,
}: {
  enlaces: Array<{ href: string; etiqueta: string }>;
  pendientes: number;
}) {
  const ruta = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar md:h-full md:w-60 md:border-b-0 md:border-r">
      <nav aria-label="Secciones" className="flex flex-col gap-1 p-2">
        {enlaces.map((enlace) => {
          const activo = ruta === enlace.href || ruta.startsWith(`${enlace.href}/`);
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className={
                activo
                  ? "flex min-h-11 items-center justify-between rounded-md bg-card px-3 text-sm text-foreground"
                  : "flex min-h-11 items-center justify-between rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              }
            >
              {enlace.etiqueta}
              {enlace.href === "/reglas" && pendientes > 0 ? (
                <span className="rounded-md bg-secondary px-1.5 text-[10px] text-foreground">{pendientes}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function Marco({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const titulo = ruta.startsWith("/entidades")
    ? "Entidades"
    : ruta.startsWith("/reglas")
      ? "Reglas sugeridas"
      : ruta.startsWith("/reportes")
        ? "Reportes"
        : ruta.startsWith("/auditoria")
          ? "Auditoría"
        : "Clientes";
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 md:p-4">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background" aria-label={titulo}>
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3">
          <span className="size-2.5 rounded-full bg-chrome-close" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-chrome-min" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-chrome-max" aria-hidden="true" />
          <p className="font-mono text-xs text-muted-foreground">{titulo}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3 md:p-4">{children}</div>
      </section>
    </div>
  );
}
