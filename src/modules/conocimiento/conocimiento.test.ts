import { describe, expect, it } from "vitest";

import { DIMENSION_EMBEDDING } from "@/modules/conocimiento/constantes";
import { buscarEnMemoria } from "@/modules/conocimiento/buscar";
import { embeddingLocal } from "@/modules/conocimiento/embedding";
import { fragmentarPolitica } from "@/modules/conocimiento/fragmentar";

const politica = `# EJEMPLO
## Edad
La edad mínima del titular es 18 años y la máxima es 70.
--- pagina 2 ---
## Ingresos
El ingreso mensual mínimo de este ejemplo es de dos millones.
`;

describe("fragmentos y búsqueda", () => {
  it("conserva sección y página", () => {
    const fragmentos = fragmentarPolitica(politica);
    expect(fragmentos.map((fragmento) => [fragmento.seccion, fragmento.pagina])).toEqual([
      ["EJEMPLO", 1],
      ["Edad", 1],
      ["Ingresos", 2],
    ]);
  });

  it("responde con el fragmento de la sección y no inventa si no hay evidencia", () => {
    const fragmentos = fragmentarPolitica(politica).map((fragmento, indice) => ({
      id: `f${indice}`,
      ...fragmento,
    }));
    const edad = buscarEnMemoria("edad mínima del titular", fragmentos);
    expect(edad[0]?.seccion).toBe("Edad");
    expect(edad[0]?.pagina).toBe(1);
    expect(buscarEnMemoria("hipoteca de yate lunar", fragmentos)).toEqual([]);
  });

  it("usa una sola dimensión", () => {
    expect(embeddingLocal("politica de ejemplo")).toHaveLength(DIMENSION_EMBEDDING);
  });
});
