import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

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
  @MaxLength(200)
  titulo!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  mensaje!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  empresaNombre?: string;

  @ApiProperty({ required: false, description: "Para deduplicar: evita crear otra si ya hay una sin leer del mismo tipo+empresa+destinatario" })
  @IsOptional()
  @IsString()
  empresaId?: string;
}
