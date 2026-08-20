import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Reporte de falla del botón de soporte. Los límites espejan los de
 * ReporteSoporteDto en notificaciones-service — validar ya aquí evita que un
 * texto de 50 KB haga un salto de red extra solo para ser rechazado al final.
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

/** Lo único que el administrador cambia de un reporte desde el buzón. */
export class ActualizarReporteSoporteDto {
  @ApiProperty({ enum: ESTADOS_REPORTE, example: "atendido" })
  @IsIn(ESTADOS_REPORTE)
  estado!: (typeof ESTADOS_REPORTE)[number];
}
