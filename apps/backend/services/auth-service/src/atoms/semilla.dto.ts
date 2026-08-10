import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MinLength } from "class-validator";

export class GenerarSemillaDto {
  @ApiProperty({ example: "Daniel", description: "Nombre que el emprendedor le dirá a Alexa para identificarse" })
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class ValidarSemillaDto {
  @ApiProperty({ example: "Daniel" })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ example: "4829" })
  @IsString()
  @Length(4, 4)
  seed!: string;
}
