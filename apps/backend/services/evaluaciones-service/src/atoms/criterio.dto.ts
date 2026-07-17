import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, Min } from "class-validator";

export class CreateCriterioDto {
  @ApiProperty({ example: "Problema y solución" })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: "Claridad del problema identificado y qué tan bien lo resuelve la solución." })
  @IsString()
  descripcion!: string;

  @ApiProperty({ example: 25, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  peso!: number;
}

export class EditarCriterioDto extends CreateCriterioDto {}
