import { ApiProperty } from "@nestjs/swagger";
import { ACCIONES, MODULOS, type Accion, type Modulo } from "@leanstart/backend-commons";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, ValidateNested } from "class-validator";

export class ToggleAccionDto {
  @ApiProperty({ enum: MODULOS })
  @IsIn(MODULOS)
  modulo!: Modulo;

  @ApiProperty({ enum: ACCIONES })
  @IsIn(ACCIONES)
  accion!: Accion;
}

export class ToggleModuloDto {
  @ApiProperty({ enum: MODULOS })
  @IsIn(MODULOS)
  modulo!: Modulo;
}

export class ToggleColumnaDto {
  @ApiProperty({ enum: ACCIONES })
  @IsIn(ACCIONES)
  accion!: Accion;
}

export class SetTodosDto {
  @ApiProperty()
  @IsBoolean()
  activar!: boolean;
}

export class CambioCeldaDto {
  @ApiProperty({ enum: MODULOS })
  @IsIn(MODULOS)
  modulo!: Modulo;

  @ApiProperty({ enum: ACCIONES })
  @IsIn(ACCIONES)
  accion!: Accion;

  @ApiProperty()
  @IsBoolean()
  activar!: boolean;
}

/** Guardado en bloque de un borrador: cada celda trae su estado FINAL deseado
 *  (no un toggle relativo), así que da igual si de por medio cambiaron los
 *  roles del usuario — el resultado es exactamente el que se ve en el borrador. */
export class SetCeldasDto {
  @ApiProperty({ type: [CambioCeldaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CambioCeldaDto)
  cambios!: CambioCeldaDto[];
}
