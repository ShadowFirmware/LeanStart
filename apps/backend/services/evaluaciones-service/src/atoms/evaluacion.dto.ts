import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Max, Min } from "class-validator";

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

export class SetComentarioCriterioDto {
  @ApiProperty()
  @IsString()
  criterioId!: string;

  @ApiProperty()
  @IsString()
  comentario!: string;
}

export class SetComentarioDto {
  @ApiProperty()
  @IsString()
  comentario!: string;
}
