"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const iconos: Record<string, LucideIcon> = {
  clientes: Users,
  entidades: Building2,
  reglas: ShieldCheck,
  reportes: BarChart3,
  auditoria: FileText,
};

type Enlace = {
  href: string;
  etiqueta: string;
  icono: keyof typeof iconos;
  grupo: "desk" | "controls";
};

export function BarraIzquierda({
  enlaces,
  pendientes,
  rol,
  accionesPerfil,
}: {
  enlaces: Enlace[];
  pendientes: number;
  rol: string;
  accionesPerfil: ReactNode;
}) {
  const ruta = usePathname();
  const [colapsada, setColapsada] = useState(false);
  const grupos: Array<{ id: Enlace["grupo"]; titulo: string }> = [
    { id: "desk", titulo: "ESCRITORIO" },
    { id: "controls", titulo: "CONTROLES" },
  ];

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:h-dvh md:border-b-0 md:border-r ${
        colapsada ? "md:w-[76px]" : "md:w-[248px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/clientes" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <LayoutDashboard className="size-4" aria-hidden="true" />
          </span>
          <span className={colapsada ? "min-w-0 md:hidden" : "min-w-0"}>
            <span className="block truncate text-sm font-semibold tracking-tight">
              Consorcio AI
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Preanálisis crediticio
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setColapsada((actual) => !actual)}
          aria-label={colapsada ? "Expandir navegación" : "Contraer navegación"}
          aria-expanded={!colapsada}
          className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
        >
          {colapsada ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <form action="/clientes" className="hidden px-3 pb-5 md:block">
        <label className="relative block">
          <span className="sr-only">Buscar clientes</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            name="q"
            placeholder="Buscar clientes..."
            className="h-10 w-full rounded-xl border border-sidebar-border bg-background/70 pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </form>

      <nav
        aria-label="Secciones"
        className="flex min-w-0 flex-row gap-3 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:gap-6 md:overflow-y-auto md:px-3 md:pb-4"
      >
        {grupos.map((grupo) => {
          const items = enlaces.filter((enlace) => enlace.grupo === grupo.id);
          if (items.length === 0) return null;
          return (
            <section key={grupo.id} className="shrink-0">
              <p
                className={`hidden px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground md:block ${
                  colapsada ? "md:sr-only" : ""
                }`}
              >
                {grupo.titulo}
              </p>
              <div className="flex gap-1 md:flex-col">
                {items.map((enlace) => {
                  const activo =
                    ruta === enlace.href || ruta.startsWith(`${enlace.href}/`);
                  const Icono = iconos[enlace.icono];
                  return (
                    <Link
                      key={enlace.href}
                      href={enlace.href}
                      aria-current={activo ? "page" : undefined}
                      aria-label={enlace.etiqueta}
                      title={colapsada ? enlace.etiqueta : undefined}
                      className={`group flex min-h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10 md:text-[13px] ${
                        colapsada ? "md:justify-center md:px-0" : ""
                      } ${
                        activo
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                      }`}
                    >
                      <Icono className="size-4 shrink-0" aria-hidden="true" />
                      <span className={colapsada ? "md:hidden" : ""}>
                        {enlace.etiqueta}
                      </span>
                      {enlace.href === "/reglas" && pendientes > 0 ? (
                        <span
                          className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground ${
                            colapsada ? "md:hidden" : ""
                          }`}
                        >
                          {pendientes > 99 ? "99+" : pendientes}
                        </span>
                      ) : null}
                      {activo && !colapsada ? (
                        <ChevronRight className="ml-auto size-3.5" aria-hidden="true" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="hidden space-y-3 p-3 md:block">
        <Link
          href="/reglas"
          className={`block rounded-2xl bg-primary p-3 text-primary-foreground transition hover:opacity-90 ${
            colapsada ? "md:hidden" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Reglas por revisar</span>
            <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold">
              {pendientes}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-primary-foreground/70">
            {pendientes === 0
              ? "Todo está al día"
              : "Propuestas pendientes de aprobación"}
          </p>
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {Array.from({ length: 8 }, (_, indice) => (
              <span
                key={indice}
                className={`h-1 flex-1 rounded-full ${
                  indice < Math.min(pendientes, 8)
                    ? "bg-primary-foreground"
                    : "bg-primary-foreground/20"
                }`}
              />
            ))}
          </div>
        </Link>

        <div
          className={`flex items-center gap-2 rounded-2xl border border-sidebar-border bg-card p-2.5 ${
            colapsada ? "md:justify-center md:p-2" : ""
          }`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-[10px] font-semibold text-mint-foreground">
            {rol.slice(0, 2)}
          </span>
          <span className={colapsada ? "min-w-0 flex-1 md:hidden" : "min-w-0 flex-1"}>
            <span className="block truncate text-xs font-medium">Equipo Consorcio</span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {rol}
            </span>
          </span>
          <span className={colapsada ? "md:hidden" : ""}>{accionesPerfil}</span>
        </div>
      </div>
    </aside>
  );
}

export function Marco({
  children,
  pendientes,
  puedeCrearCliente,
  puedeVerReglas,
}: {
  children: React.ReactNode;
  pendientes: number;
  puedeCrearCliente: boolean;
  puedeVerReglas: boolean;
}) {
  const ruta = usePathname();
  const titulo = ruta.startsWith("/entidades")
    ? "Entidades"
    : ruta.startsWith("/reglas")
      ? "Reglas sugeridas"
      : ruta.startsWith("/reportes")
        ? "Reportes"
        : ruta.startsWith("/auditoria")
          ? "Auditoría"
          : ruta === "/clientes/nuevo"
            ? "Nuevo cliente"
            : ruta.startsWith("/clientes/")
              ? "Detalle del cliente"
              : "Clientes";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 flex min-h-[60px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-xl md:px-7">
        <nav
          aria-label="Ruta de navegación"
          className="flex min-w-0 items-center gap-2 text-xs"
        >
          <span className="hidden text-muted-foreground sm:inline">Consorcio AI</span>
          <ChevronRight
            className="hidden size-3.5 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <span className="truncate font-medium text-foreground" aria-current="page">
            {titulo}
          </span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-success/20 bg-success-muted px-3 py-1.5 text-[11px] font-medium text-success sm:inline-flex">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Sesión activa
          </span>
          {puedeVerReglas ? (
            <Link
              href="/reglas"
              aria-label={`Reglas pendientes: ${pendientes}`}
              title="Ver reglas sugeridas"
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {pendientes > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] font-semibold leading-4 text-primary-foreground">
                  {pendientes > 9 ? "9+" : pendientes}
                </span>
              ) : null}
            </Link>
          ) : null}
          {puedeCrearCliente ? (
            <Link
              href="/clientes/nuevo"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-soft transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="text-base leading-none" aria-hidden="true">
                +
              </span>
              <span className="hidden sm:inline">Nuevo cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>
          ) : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-7">{children}</div>
    </div>
  );
}
