import { EspacioTrabajo } from "@/components/espacio-trabajo";

export default function Tablero({ children }: { children: React.ReactNode }) {
  return <EspacioTrabajo>{children}</EspacioTrabajo>;
}
