/**
 * Convierte un File a data URL (base64) para persistir en localStorage.
 * A diferencia de URL.createObjectURL(file), el data URL sobrevive recargas
 * y se puede guardar como string en cualquier store.
 *
 * Notas:
 * - Para imágenes grandes considera comprimir antes (data URLs ocupan ~33% más).
 * - localStorage tiene un límite de ~5-10MB por dominio.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("FileReader returned non-string result"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}
