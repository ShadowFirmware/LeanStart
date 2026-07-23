import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const ESTADOS_EMPRESA = [
  "borrador",
  "pendiente_mentoria",
  "en_mentoria",
  "observaciones_pendientes",
  "observaciones_atendidas",
  "pendiente_evaluacion",
  "en_evaluacion",
  "publicado",
  "devuelto",
] as const;

export class CambiarEstadoDto {
  @ApiProperty({ enum: ESTADOS_EMPRESA })
  @IsIn(ESTADOS_EMPRESA)
  estado!: (typeof ESTADOS_EMPRESA)[number];
}

export class CambiarEstadoInternoDto extends CambiarEstadoDto {
  @ApiProperty({ required: false, description: "Score final calculado por evaluaciones-service al finalizar" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scoreFinal?: number;

  @ApiProperty({ required: false, description: "Nombre del nivel de viabilidad obtenido, congelado al finalizar" })
  @IsOptional()
  @IsString()
  nivelNombre?: string;

  @ApiProperty({ required: false, description: "Color del nivel de viabilidad obtenido, congelado al finalizar" })
  @IsOptional()
  @IsString()
  nivelColor?: string;
}

/** Usado solo por el script de backfill (rellena el nivel en empresas ya evaluadas antes de este cambio). */
export class ActualizarNivelInternoDto {
  @ApiProperty({ description: "Nombre del nivel de viabilidad" })
  @IsString()
  nivelNombre!: string;

  @ApiProperty({ description: "Color del nivel de viabilidad" })
  @IsString()
  nivelColor!: string;
}

export class AsignarDto {
  @ApiProperty({ description: "Id del usuario (mentor o evaluador) a asignar" })
  @IsString()
  userId!: string;
}
