import { fileToDataUrl } from "./file-to-data-url";

export interface CompressImageOptions {
  /** Lado máximo (px). La imagen se reescala manteniendo proporción. Default 1280. */
  maxDimension?: number;
  /** Calidad 0–1 (solo aplica a JPEG/WebP). Default 0.72. */
  quality?: number;
  /** Formato de salida. Default "image/jpeg". Usa "image/png" para preservar transparencia. */
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

/**
 * Reescala y recomprime una imagen a un data URL mucho más ligero antes de
 * persistirla en localStorage. Un JPEG de ~1280px pesa ~50-150KB frente a los
 * 1-2MB del archivo original, evitando el QuotaExceededError del store.
 *
 * - Los SVG (vectores) y cualquier no-imagen se devuelven tal cual (fileToDataUrl).
 * - Ante cualquier fallo del canvas cae al data URL original (nunca lanza).
 * - Para JPEG se rellena el fondo de blanco (los data URL JPEG no tienen alfa).
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const { maxDimension = 1280, quality = 0.72, mimeType = "image/jpeg" } = options;

  // Vectores y no-imágenes: no se rasterizan.
  if (file.type === "image/svg+xml" || !file.type.startsWith("image/")) {
    return fileToDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    let { width, height } = img;
    if (!width || !height) return fileToDataUrl(file);

    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToDataUrl(file);

    // JPEG no soporta transparencia: aplanar sobre blanco evita un fondo negro.
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL(mimeType, quality);
    // Si el "comprimido" saliera mayor (imágenes ya diminutas), conserva el original.
    const original = await fileToDataUrl(file);
    return compressed.length < original.length ? compressed : original;
  } catch {
    return fileToDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
