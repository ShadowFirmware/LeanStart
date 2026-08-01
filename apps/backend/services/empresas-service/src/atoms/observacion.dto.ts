import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

const TIPOS_ELEMENTO = ["canvas", "producto", "hipotesis", "general"] as const;

// Mismo límite que ya exige el frontend (observaciones-button.tsx: MAX_COMENTARIO).
const MAX_COMENTARIO = 500;

export class CreateObservacionDto {
  @ApiProperty({ enum: TIPOS_ELEMENTO })
  @IsIn(TIPOS_ELEMENTO)
  tipoElemento!: (typeof TIPOS_ELEMENTO)[number];

  @ApiProperty({ description: "Clave del bloque de canvas, o id del producto/hipótesis/empresa" })
  @IsString()
  elementoId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMENTARIO)
  comentario!: string;

  @ApiProperty({ description: "Nombre para mostrar del autor (el cliente ya lo conoce de su propia sesión)" })
  @IsString()
  @MaxLength(100)
  autorNombre!: string;
}
