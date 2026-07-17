import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

const TIPOS = ["producto", "servicio"] as const;
const MODALIDADES = ["rango", "periodo", "personalizado"] as const;
const UNIDADES = ["dia", "semana", "mes", "anio"] as const;

export class CreateProductoDto {
  @ApiProperty({ example: "Suscripción mensual" })
  @IsString()
  nombre!: string;

  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @ApiProperty()
  @IsString()
  descripcion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caracteristicas?: string;

  @ApiPropertyOptional({ description: "Solo aplica a tipo producto" })
  @IsOptional()
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional({ type: [String], description: "Data URLs comprimidas" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ enum: MODALIDADES, description: "Solo aplica a tipo servicio" })
  @IsOptional()
  @IsIn(MODALIDADES)
  modalidadPrecio?: (typeof MODALIDADES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precioMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precioMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precioPeriodo?: number;

  @ApiPropertyOptional({ enum: UNIDADES })
  @IsOptional()
  @IsIn(UNIDADES)
  unidadTiempo?: (typeof UNIDADES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  precioPersonalizado?: string;
}

export class UpdateProductoDto extends CreateProductoDto {}
