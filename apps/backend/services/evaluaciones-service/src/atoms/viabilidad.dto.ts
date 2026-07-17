import { ApiProperty } from "@nestjs/swagger";
import { IsHexColor, IsInt, IsString, Max, Min } from "class-validator";

export class ActualizarPesoDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 80 })
  @IsInt()
  @Min(0)
  @Max(100)
  peso!: number;
}

export class ActualizarUmbralDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 70 })
  @IsInt()
  @Min(0)
  @Max(100)
  umbral!: number;
}

export class ActualizarHastaNivelDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  hasta!: number;
}

export class EditarNivelDto {
  @ApiProperty({ example: "Media" })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: "#F59E0B" })
  @IsHexColor()
  color!: string;
}

export class ReordenarNivelDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  desde!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  hasta!: number;
}
