export type FragmentoTexto = {
  orden: number;
  seccion: string | null;
  pagina: number | null;
  texto: string;
};

export function fragmentarPolitica(texto: string): FragmentoTexto[] {
  const paginas = texto.split(/\f|(?:^|\n)--- pagina (\d+) ---\n/).filter((parte) => parte !== "");
  const bloques: { pagina: number; texto: string }[] = [];
  let pagina = 1;
  for (const parte of paginas) {
    if (/^\d+$/.test(parte)) {
      pagina = Number(parte);
      continue;
    }
    bloques.push({ pagina, texto: parte });
    pagina += 1;
  }
  if (bloques.length === 0) bloques.push({ pagina: 1, texto });

  const fragmentos: FragmentoTexto[] = [];
  for (const bloque of bloques) {
    const secciones = bloque.texto.split(/\n(?=#{1,3} )/);
    for (const seccion of secciones) {
      const limpio = seccion.trim();
      if (!limpio) continue;
      const titulo = limpio.match(/^#{1,3} (.+)$/m)?.[1]?.trim() ?? null;
      const cuerpo = limpio.replace(/^#{1,3} .+\n?/, "").trim();
      const contenido = cuerpo || limpio;
      const pedazos = contenido.length > 1200 ? partir(contenido, 1200) : [contenido];
      for (const pedazo of pedazos) {
        fragmentos.push({
          orden: fragmentos.length + 1,
          seccion: titulo,
          pagina: bloque.pagina,
          texto: titulo ? `${titulo}\n${pedazo}` : pedazo,
        });
      }
    }
  }
  return fragmentos;
}

function partir(texto: string, tamano: number) {
  const parrafos = texto.split(/\n{2,}/);
  const pedazos: string[] = [];
  let actual = "";
  for (const parrafo of parrafos) {
    if ((actual + "\n\n" + parrafo).length > tamano && actual) {
      pedazos.push(actual);
      actual = parrafo;
    } else {
      actual = actual ? `${actual}\n\n${parrafo}` : parrafo;
    }
  }
  if (actual) pedazos.push(actual);
  return pedazos;
}
