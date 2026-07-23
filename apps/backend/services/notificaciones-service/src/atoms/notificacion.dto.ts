import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

const TIPOS = [
  "comentario_mentor",
  "cambio_emprendedor",
  "enviado_evaluacion",
  "proyecto_publicado",
  "proyecto_devuelto",
  "proyecto_asignado",
] as const;

export class CreateNotificacionDto {
  @ApiProperty({ enum: TIPOS })
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @ApiProperty({ description: "Id del usuario destinatario" })
  @IsString()
  destinatarioUserId!: string;

  @ApiProperty()
  @IsString()
  titulo!: string;

  @ApiProperty()
  @IsString()
  mensaje!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  empresaNombre?: string;

  @ApiProperty({ required: false, description: "Para deduplicar: evita crear otra si ya hay una sin leer del mismo tipo+empresa+destinatario" })
  @IsOptional()
  @IsString()
  empresaId?: string;
}
