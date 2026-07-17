import { ApiProperty } from "@nestjs/swagger";
import { ACCIONES, MODULOS, type Accion, type Modulo } from "@leanstart/backend-commons";
import { IsBoolean, IsIn } from "class-validator";

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
