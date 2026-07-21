import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

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

  // Solo se exige en la creación (tipo viene siempre en el body ahí); en PATCH
  // `tipo` normalmente no se manda, así que ValidateIf no dispara y no bloquea
  // ediciones que no tocan las imágenes.
  @ApiPropertyOptional({ type: [String], description: "Data URLs comprimidas — obligatorio al crear un producto (no servicio)" })
  @ValidateIf((o) => o.tipo === "producto")
  @IsArray()
  @ArrayMinSize(1, { message: "Agrega al menos una imagen del producto." })
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

// PATCH real: todos los campos opcionales. `UpdateProductoDto extends CreateProductoDto`
// heredaba `nombre`/`tipo`/`descripcion` como REQUERIDOS, así que cualquier edición
// (que solo manda el subconjunto de campos que cambiaron, nunca `tipo`) era rechazada
// con 400 por el ValidationPipe — por eso "no se puede actualizar" ni productos ni servicios.
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
