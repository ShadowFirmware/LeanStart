import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const MIME_A_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sube imágenes (avatar de usuario, logo de empresa) a S3 y devuelve la URL
 * pública del objeto. En EC2 (con LabInstanceProfile/un rol de instancia real)
 * el SDK toma credenciales automáticamente de la instancia — no hace falta
 * ninguna access key en el .env, solo AWS_REGION y S3_BUCKET_NAME. Sin
 * S3_BUCKET_NAME configurado, el servicio lo dice explícito en vez de fallar
 * a medias (mismo criterio que EmailService con RESEND_API_KEY).
 */
@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly client = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });
  private readonly bucket = process.env.S3_BUCKET_NAME;
  private readonly region = process.env.AWS_REGION ?? "us-east-1";

  async subirImagen(archivo: { buffer: Buffer; mimetype: string; size: number }, carpeta: string): Promise<string> {
    if (!this.bucket) {
      throw new BadRequestException("Subida de archivos no configurada (falta S3_BUCKET_NAME).");
    }

    const extension = MIME_A_EXTENSION[archivo.mimetype];
    if (!extension) {
      throw new BadRequestException("Formato de imagen no soportado (usa JPEG, PNG o WebP).");
    }
    const MAX_BYTES = 5 * 1024 * 1024;
    if (archivo.size > MAX_BYTES) {
      throw new BadRequestException("La imagen no puede pesar más de 5MB.");
    }

    const key = `${carpeta}/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: archivo.buffer,
        ContentType: archivo.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    this.logger.log(`Imagen subida: s3://${this.bucket}/${key}`);
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
