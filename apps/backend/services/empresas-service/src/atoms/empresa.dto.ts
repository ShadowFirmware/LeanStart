import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GIRO_LABELS, type GiroEmpresa } from "@leanstart/backend-commons";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const GIROS = Object.keys(GIRO_LABELS) as GiroEmpresa[];

// Mismos límites que ya exige el formulario de creación en el frontend
// (empresa-new-view.tsx: MAX_NOMBRE/MAX_DESCRIPCION/MAX_MERCADO).
const MAX_NOMBRE = 100;
const MAX_DESCRIPCION = 500;
const MAX_MERCADO = 500;
// El logo ya viene comprimido por el cliente (compressImageToDataUrl); este tope solo
// evita que alguien mande un data URL enorme saltándose esa compresión.
const MAX_LOGO_LEN = 3_000_000;

export class CreateEmpresaDto {
  @ApiProperty({ example: "LeanStart" })
  @IsString()
  @MinLength(2)
  @MaxLength(MAX_NOMBRE)
  nombre!: string;

  @ApiProperty({ enum: GIROS, example: "tecnologia" })
  @IsIn(GIROS)
  giro!: GiroEmpresa;

  @ApiProperty({ example: "Ayudamos a emprendedores a validar su idea de negocio." })
  @IsString()
  @MinLength(20)
  @MaxLength(MAX_DESCRIPCION)
  descripcion!: string;

  @ApiProperty({ example: "Emprendedores en etapa temprana" })
  @IsString()
  @MinLength(20)
  @MaxLength(MAX_MERCADO)
  mercadoObjetivo!: string;

  @ApiPropertyOptional({ description: "Logo en data URL comprimido." })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LOGO_LEN)
  logoUrl?: string;
}

export class UpdateEmpresaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(MAX_NOMBRE)
  nombre?: string;

  @ApiPropertyOptional({ enum: GIROS })
  @IsOptional()
  @IsIn(GIROS)
  giro?: GiroEmpresa;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(MAX_DESCRIPCION)
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(MAX_MERCADO)
  mercadoObjetivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LOGO_LEN)
  logoUrl?: string;
}
