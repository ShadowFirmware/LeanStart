import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, MaxLength, Min } from "class-validator";

export class SetPuntajeDto {
  @ApiProperty()
  @IsString()
  criterioId!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  puntaje!: number;
}

// Mismos límites que ya exige el frontend (evaluacion-form.tsx: MAX_COMENTARIO_CRITERIO/MAX_COMENTARIO_GENERAL).
export class SetComentarioCriterioDto {
  @ApiProperty()
  @IsString()
  criterioId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  comentario!: string;
}

export class SetComentarioDto {
  @ApiProperty()
  @IsString()
  @MaxLength(600)
  comentario!: string;
}
