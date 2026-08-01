import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

// Mismos límites que ya exige el frontend (criterios-evaluacion-view.tsx).
export class CreateCriterioDto {
  @ApiProperty({ example: "Problema y solución" })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre!: string;

  @ApiProperty({ example: "Claridad del problema identificado y qué tan bien lo resuelve la solución." })
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  descripcion!: string;

  @ApiProperty({ example: 25, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  peso!: number;
}

export class EditarCriterioDto extends CreateCriterioDto {}
