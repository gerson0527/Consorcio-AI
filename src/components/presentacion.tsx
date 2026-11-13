import { cn } from "cn";

const roles: Record<string, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
  AUDITOR: "Auditor",
};

const creditos: Record<string, string> = {
  LIBRANZA: "Libranza",
  VEHICULO: "Vehículo",
  VIVIENDA: "Vivienda",
  CONSUMO: "Consumo",
};

const entidades: Record<string, string> = {
  BANCO: "Banco",
  FINANCIERA: "Financiera",
  COOPERATIVA: "Cooperativa",
};

const documentos: Record<string, string> = {
  cedula: "Cédula de ciudadanía",
  desprendible: "Desprendibles de nómina",
  certificado_laboral: "Certificado laboral",
  extracto: "Extracto",
  otro: "Otro",
};

export function rolLegible(rol: string) {
  return roles[rol] ?? rol;
}

export function creditoLegible(tipo: string | null | undefined) {
  if (!tipo) return "Sin caso";
  return creditos[tipo] ?? tipo;
}

export function entidadLegible(tipo: string) {
  return entidades[tipo] ?? tipo;
}

export function documentoLegible(tipo: string) {
  return documentos[tipo] ?? tipo;
}

export function MarcaEjemplo() {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Datos de ejemplo
    </span>
  );
}

const pastillas: Record<string, string> = {
  Evaluado: "bg-success-muted text-success",
  "Evaluación lista": "bg-success-muted text-success",
  Procesando: "bg-ia-muted text-ia",
  "Por revisar": "bg-warning-muted text-warning",
  "Resultado pendiente": "bg-muted text-muted-foreground",
  Activa: "bg-success-muted text-success",
  Inactiva: "bg-muted text-muted-foreground",
  Pendiente: "bg-ia-muted text-ia",
  "Cumple todas las reglas": "bg-success-muted text-success",
  Condicionado: "bg-warning-muted text-warning",
  "No cumple reglas": "bg-warning-muted text-warning",
  "Sin datos suficientes": "bg-muted text-muted-foreground",
};

export function Pastilla({ children }: { children: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", pastillas[children] ?? "bg-muted text-muted-foreground")}>
      {children}
    </span>
  );
}

export function Barra({
  valor,
  tono = "primario",
}: {
  valor: number;
  tono?: "primario" | "exito" | "alerta";
}) {
  const color = tono === "exito" ? "bg-success" : tono === "alerta" ? "bg-warning" : "bg-primary";
  const ancho = Math.max(0, Math.min(100, Number.isFinite(valor) ? valor : 0));
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={cn("h-2 rounded-full", color)} style={{ width: `${ancho}%` }} />
    </div>
  );
}

export function textoDocumentos(estados: string[]) {
  if (estados.length === 0) return "Sin documentos";
  if (estados.some((estado) => estado === "PENDIENTE" || estado === "PROCESANDO")) return "Extrayendo datos";
  const revisar = estados.filter((estado) => estado === "REVISAR" || estado === "ERROR").length;
  if (revisar > 0) return `${revisar} por revisar`;
  const listos = estados.filter((estado) => estado === "PROCESADO").length;
  return `${listos} de ${estados.length} procesados`;
}

export function textoVeredicto(veredicto: string, cumpleReglas: boolean) {
  if (veredicto === "FAVORABLE" && cumpleReglas) return "Cumple todas las reglas";
  if (veredicto === "CONDICIONADO") return "Condicionado";
  if (veredicto === "DESFAVORABLE" || !cumpleReglas) return "No cumple reglas";
  return "Sin datos suficientes";
}
