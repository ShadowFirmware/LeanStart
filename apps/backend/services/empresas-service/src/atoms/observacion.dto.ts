import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

const TIPOS_ELEMENTO = ["canvas", "producto", "hipotesis", "general"] as const;

export class CreateObservacionDto {
  @ApiProperty({ enum: TIPOS_ELEMENTO })
  @IsIn(TIPOS_ELEMENTO)
  tipoElemento!: (typeof TIPOS_ELEMENTO)[number];

  @ApiProperty({ description: "Clave del bloque de canvas, o id del producto/hipótesis/empresa" })
  @IsString()
  elementoId!: string;

  @ApiProperty()
  @IsString()
  comentario!: string;

  @ApiProperty({ description: "Nombre para mostrar del autor (el cliente ya lo conoce de su propia sesión)" })
  @IsString()
  autorNombre!: string;
}
