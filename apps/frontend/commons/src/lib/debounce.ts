/**
 * Retrasa la ejecución de `fn` hasta que pasen `ms` sin nuevas llamadas —
 * cancela el timer anterior en cada invocación. Se usa para no saturar la API
 * con inputs de alta frecuencia (sliders, steppers, texto en cada tecla): el
 * store sigue actualizando el estado local al instante, solo la llamada de
 * red se debounce.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
