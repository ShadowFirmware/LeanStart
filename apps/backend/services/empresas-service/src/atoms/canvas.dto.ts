import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from "class-validator";

// Mismos límites que ya aplica el frontend (canvas-view.tsx): hasta 8 items por bloque
// (estructuraCostos usa 8, el resto 5 — 10 deja margen sin ser el cuello de botella) y
// 100 caracteres por item de lista / 400 por bloque de texto libre.
const MAX_ITEMS = 10;
const MAX_ITEM_LEN = 100;
const MAX_TEXTO_LEN = 400;

export class UpdateCanvasDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  problema?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXTO_LEN)
  solucion?: string;

  @ApiPropertyOptional({ description: "Propuesta de valor" })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXTO_LEN)
  pvp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXTO_LEN)
  ventajaInjusta?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  segmentosClientes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  metricasClave?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  canales?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  estructuraCostos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(MAX_ITEM_LEN, { each: true })
  fuentesIngresos?: string[];
}
