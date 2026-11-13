type Ventana = { cantidad: number; reiniciaEn: number };

const ventanas = new Map<string, Ventana>();

export function limitar(clave: string, maximo: number, ventanaMs: number, ahora = Date.now()) {
  const vigente = ventanas.get(clave);
  if (!vigente || vigente.reiniciaEn <= ahora) {
    ventanas.set(clave, { cantidad: 1, reiniciaEn: ahora + ventanaMs });
    return true;
  }
  if (vigente.cantidad >= maximo) {
    return false;
  }
  vigente.cantidad += 1;
  return true;
}

export function reiniciarLimites() {
  ventanas.clear();
}
