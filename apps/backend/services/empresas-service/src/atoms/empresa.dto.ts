import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GIRO_LABELS, type GiroEmpresa } from "@leanstart/backend-commons";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const GIROS = Object.keys(GIRO_LABELS) as GiroEmpresa[];

export class CreateEmpresaDto {
  @ApiProperty({ example: "LeanStart" })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ enum: GIROS, example: "tecnologia" })
  @IsIn(GIROS)
  giro!: GiroEmpresa;

  @ApiProperty({ example: "Ayudamos a emprendedores a validar su idea de negocio." })
  @IsString()
  descripcion!: string;

  @ApiProperty({ example: "Emprendedores en etapa temprana" })
  @IsString()
  mercadoObjetivo!: string;

  @ApiPropertyOptional({ description: "Logo en data URL comprimido." })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateEmpresaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ enum: GIROS })
  @IsOptional()
  @IsIn(GIROS)
  giro?: GiroEmpresa;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mercadoObjetivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
