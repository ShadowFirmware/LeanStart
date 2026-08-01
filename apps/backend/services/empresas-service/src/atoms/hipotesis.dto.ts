import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const TIPOS_EXPERIMENTO = [
  "encuesta",
  "entrevista",
  "landing_page",
  "prototipo",
  "prueba_de_mercado",
  "otro",
] as const;
const TIPOS_EVIDENCIA = ["pdf", "imagen", "documento", "url"] as const;

// Mismos límites que ya exige el frontend (hipotesis-new-view.tsx / hipotesis-edit-view.tsx).
const MAX_TITULO = 120;
const MAX_TEXTAREA = 400;
const MAX_CRITERIO_EXITO = 200;
const MAX_EVIDENCIA_NOMBRE = 300;
// Data URL base64 del archivo de evidencia (pdf/imagen/documento) — límite generoso,
// solo para evitar abuso, no para rechazar archivos legítimos.
const MAX_EVIDENCIA_LEN = 5_000_000;

export class CreateHipotesisDto {
  @ApiProperty({ example: "Los emprendedores primerizos abandonan por falta de mentoría estructurada" })
  @IsString()
  @MinLength(5)
  @MaxLength(MAX_TITULO)
  titulo!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(MAX_TEXTAREA)
  descripcion!: string;
}

export class UpdateHipotesisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(MAX_TITULO)
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(MAX_TEXTAREA)
  descripcion?: string;
}

export class ExperimentoDisenoDto {
  @ApiProperty({ enum: TIPOS_EXPERIMENTO })
  @IsIn(TIPOS_EXPERIMENTO)
  tipo!: (typeof TIPOS_EXPERIMENTO)[number];

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_TEXTAREA)
  descripcion!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_TEXTAREA)
  objetivo!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_CRITERIO_EXITO)
  criterioExito!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaObjetivo?: string;
}

export class ResultadosHipotesisDto {
  @ApiProperty()
  @IsString()
  @MaxLength(MAX_TEXTAREA)
  resultado!: string;

  @ApiPropertyOptional({ description: "Data URL base64 del archivo, o la URL si tipoEvidencia = url" })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_EVIDENCIA_LEN)
  evidencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_EVIDENCIA_NOMBRE)
  evidenciaNombre?: string;

  @ApiPropertyOptional({ enum: TIPOS_EVIDENCIA })
  @IsOptional()
  @IsIn(TIPOS_EVIDENCIA)
  tipoEvidencia?: (typeof TIPOS_EVIDENCIA)[number];

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_TEXTAREA)
  conclusion!: string;
}
