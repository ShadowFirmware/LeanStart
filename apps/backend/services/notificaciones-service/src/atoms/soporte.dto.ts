import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Reporte de falla que un usuario manda desde "Mi perfil → Soporte técnico".
 * Se guarda en base y se lee desde el buzón de /administrador/soporte; no hay
 * correo de por medio. La identidad de quien reporta NO viaja en el body — se
 * toma de los headers de identidad que ya validó el gateway, para que nadie
 * pueda reportar en nombre de otro.
 */
export class ReporteSoporteDto {
  @ApiProperty({ example: "No carga el canvas de mi empresa", minLength: 5, maxLength: 120 })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  asunto!: string;

  @ApiProperty({ example: "Al abrir la empresa la pantalla se queda en blanco…", minLength: 20, maxLength: 2000 })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  mensaje!: string;

  @ApiPropertyOptional({ example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)…" })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  navegador?: string;
}

export const ESTADOS_REPORTE = ["nuevo", "atendido"] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];

/** Lo único que el administrador cambia de un reporte desde el buzón. */
export class ActualizarReporteSoporteDto {
  @ApiProperty({ enum: ESTADOS_REPORTE, example: "atendido" })
  @IsIn(ESTADOS_REPORTE)
  estado!: EstadoReporte;
}
