import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateCanvasDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problema?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solucion?: string;

  @ApiPropertyOptional({ description: "Propuesta de valor" })
  @IsOptional()
  @IsString()
  pvp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ventajaInjusta?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentosClientes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricasClave?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canales?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  estructuraCostos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fuentesIngresos?: string[];
}
