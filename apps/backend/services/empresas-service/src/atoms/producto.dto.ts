import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsNumber, IsOptional, IsString,
  Max, MaxLength, Min, MinLength, ValidateIf,
} from "class-validator";

const TIPOS = ["producto", "servicio"] as const;
const MODALIDADES = ["rango", "periodo", "personalizado"] as const;
const UNIDADES = ["dia", "semana", "mes", "anio"] as const;

// Mismos límites que ya exige el frontend (producto-new-view.tsx / producto-edit-view.tsx).
const MAX_NOMBRE = 80;
const MAX_DESCRIPCION = 500;
const MAX_CARACTERISTICAS = 500;
const MAX_PRECIO = 9_999_999.99;
const MAX_IMAGENES = 10;

export class CreateProductoDto {
  @ApiProperty({ example: "Suscripción mensual" })
  @IsString()
  @MinLength(2)
  @MaxLength(MAX_NOMBRE)
  nombre!: string;

  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(MAX_DESCRIPCION)
  descripcion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_CARACTERISTICAS)
  caracteristicas?: string;

  @ApiPropertyOptional({ description: "Solo aplica a tipo producto" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRECIO)
  precio?: number;

  // Solo se exige en la creación (tipo viene siempre en el body ahí); en PATCH
  // `tipo` normalmente no se manda, así que ValidateIf no dispara y no bloquea
  // ediciones que no tocan las imágenes.
  @ApiPropertyOptional({ type: [String], description: "Data URLs comprimidas — obligatorio al crear un producto (no servicio)" })
  @ValidateIf((o) => o.tipo === "producto")
  @IsArray()
  @ArrayMinSize(1, { message: "Agrega al menos una imagen del producto." })
  @ArrayMaxSize(MAX_IMAGENES)
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ enum: MODALIDADES, description: "Solo aplica a tipo servicio" })
  @IsOptional()
  @IsIn(MODALIDADES)
  modalidadPrecio?: (typeof MODALIDADES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRECIO)
  precioMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRECIO)
  precioMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRECIO)
  precioPeriodo?: number;

  @ApiPropertyOptional({ enum: UNIDADES })
  @IsOptional()
  @IsIn(UNIDADES)
  unidadTiempo?: (typeof UNIDADES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  precioPersonalizado?: string;
}

// PATCH real: todos los campos opcionales. `UpdateProductoDto extends CreateProductoDto`
// heredaba `nombre`/`tipo`/`descripcion` como REQUERIDOS, así que cualquier edición
// (que solo manda el subconjunto de campos que cambiaron, nunca `tipo`) era rechazada
// con 400 por el ValidationPipe — por eso "no se puede actualizar" ni productos ni servicios.
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
