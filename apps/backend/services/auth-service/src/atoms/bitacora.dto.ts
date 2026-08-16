import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const SERVICIOS = ["auth", "empresas", "evaluaciones"] as const;

export class RegistrarBitacoraDto {
  @ApiProperty({ enum: SERVICIOS })
  @IsIn(SERVICIOS)
  servicio!: (typeof SERVICIOS)[number];

  @ApiProperty({ description: 'Acción corta, ej. "usuario.editar", "empresa.asignar_mentor"' })
  @IsString()
  @MaxLength(80)
  accion!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entidadTipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entidadId?: string;

  @ApiProperty({ required: false, description: "Texto legible del objeto afectado (ej. nombre de la empresa)" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  entidadDescripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  detalle?: string;
}
