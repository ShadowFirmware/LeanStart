import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsHexColor, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

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

/**
 * Alta de un nivel. Todos los campos son opcionales para no romper al cliente
 * viejo, que llamaba sin cuerpo y esperaba que el servidor partiera en dos el
 * último tramo. Cuando llega `hasta`, el nivel se inserta en la posición que le
 * corresponde según su límite superior.
 */
export class AgregarNivelDto {
  @ApiPropertyOptional({ example: "Media" })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  nombre?: string;

  @ApiPropertyOptional({ example: "#F59E0B" })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 99, description: "Límite superior inclusivo. El último nivel siempre termina en 100." })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  hasta?: number;
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
