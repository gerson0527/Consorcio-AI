import { salir } from "@/app/(auth)/login/acciones";
import { LogOut } from "lucide-react";
import { BarraIzquierda, Marco } from "@/components/paneles-trabajo";
import { rolLegible } from "@/components/presentacion";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

const enlaces = [
  {
    href: "/clientes",
    etiqueta: "Clientes",
    accion: "ver_clientes" as const,
    icono: "clientes" as const,
    grupo: "desk" as const,
  },
  {
    href: "/entidades",
    etiqueta: "Entidades",
    accion: "ver_entidades" as const,
    icono: "entidades" as const,
    grupo: "controls" as const,
  },
  {
    href: "/reglas",
    etiqueta: "Reglas sugeridas",
    accion: "aprobar_reglas" as const,
    icono: "reglas" as const,
    grupo: "controls" as const,
  },
  {
    href: "/reportes",
    etiqueta: "Reportes",
    accion: "ver_reportes" as const,
    icono: "reportes" as const,
    grupo: "controls" as const,
  },
  {
    href: "/auditoria",
    etiqueta: "Auditoría",
    accion: "ver_auditoria" as const,
    icono: "auditoria" as const,
    grupo: "controls" as const,
  },
];

export async function EspacioTrabajo({ children }: { children: React.ReactNode }) {
  const usuario = await sesionActual();
  const pendientes = puede(usuario.rol, "aprobar_reglas")
    ? await prisma.regla.count({ where: { estado: "PENDIENTE" } })
    : 0;
  const visibles = enlaces
    .filter((enlace) => puede(usuario.rol, enlace.accion))
    .map(({ href, etiqueta, icono, grupo }) => ({ href, etiqueta, icono, grupo }));

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground md:h-dvh md:flex-row md:overflow-hidden">
      <BarraIzquierda
        enlaces={visibles}
        pendientes={pendientes}
        rol={rolLegible(usuario.rol)}
        accionesPerfil={
          <form action={salir}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        }
      />
      <Marco
        pendientes={pendientes}
        puedeCrearCliente={puede(usuario.rol, "editar_clientes")}
        puedeVerReglas={puede(usuario.rol, "aprobar_reglas")}
      >
        {children}
      </Marco>
    </div>
  );
}
