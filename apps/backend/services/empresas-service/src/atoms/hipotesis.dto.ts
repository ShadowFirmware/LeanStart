import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

const TIPOS_EXPERIMENTO = [
  "encuesta",
  "entrevista",
  "landing_page",
  "prototipo",
  "prueba_de_mercado",
  "otro",
] as const;
const TIPOS_EVIDENCIA = ["pdf", "imagen", "documento", "url"] as const;

export class CreateHipotesisDto {
  @ApiProperty({ example: "Los emprendedores primerizos abandonan por falta de mentoría estructurada" })
  @IsString()
  titulo!: string;

  @ApiProperty()
  @IsString()
  descripcion!: string;
}

export class UpdateHipotesisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class ExperimentoDisenoDto {
  @ApiProperty({ enum: TIPOS_EXPERIMENTO })
  @IsIn(TIPOS_EXPERIMENTO)
  tipo!: (typeof TIPOS_EXPERIMENTO)[number];

  @ApiProperty()
  @IsString()
  descripcion!: string;

  @ApiProperty()
  @IsString()
  objetivo!: string;

  @ApiProperty()
  @IsString()
  criterioExito!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaObjetivo?: string;
}

export class ResultadosHipotesisDto {
  @ApiProperty()
  @IsString()
  resultado!: string;

  @ApiPropertyOptional({ description: "Data URL base64 del archivo, o la URL si tipoEvidencia = url" })
  @IsOptional()
  @IsString()
  evidencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenciaNombre?: string;

  @ApiPropertyOptional({ enum: TIPOS_EVIDENCIA })
  @IsOptional()
  @IsIn(TIPOS_EVIDENCIA)
  tipoEvidencia?: (typeof TIPOS_EVIDENCIA)[number];

  @ApiProperty()
  @IsString()
  conclusion!: string;
}
