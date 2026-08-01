import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateReporteDto {
  @ApiProperty({ example: "El contenido publicado no corresponde a un modelo de negocio real." })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  motivo!: string;

  @ApiProperty({ description: "Nombre para mostrar de quien reporta (el cliente ya lo conoce de su propia sesión)" })
  @IsString()
  @MaxLength(100)
  autorNombre!: string;
}
