export const roles = ["ADMIN", "ANALISTA", "AUDITOR"] as const;
export type Rol = (typeof roles)[number];

export const acciones = [
  "ver_clientes",
  "editar_clientes",
  "ver_entidades",
  "editar_entidades",
  "subir_politica",
  "editar_reglas",
  "aprobar_reglas",
  "evaluar",
  "registrar_resultado",
  "ver_reportes",
  "importar_historico",
  "ver_auditoria",
  "suprimir_datos",
] as const;

export type Accion = (typeof acciones)[number];

const permisos: Record<Rol, readonly Accion[]> = {
  ADMIN: acciones,
  ANALISTA: [
    "ver_clientes",
    "editar_clientes",
    "ver_entidades",
    "evaluar",
    "registrar_resultado",
    "ver_reportes",
  ],
  AUDITOR: ["ver_clientes", "ver_entidades", "ver_reportes", "ver_auditoria"],
};

export function puede(rol: Rol, accion: Accion) {
  return permisos[rol].includes(accion);
}
