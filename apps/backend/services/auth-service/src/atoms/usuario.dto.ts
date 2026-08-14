import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Role } from "@leanstart/backend-commons";
import { ArrayMinSize, IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const ROLES: Role[] = ["administrador", "emprendedor", "mentor", "evaluador"];
// bcrypt (usado para el hash) ignora en silencio todo lo que pase de 72 bytes — sin
// este tope, dos contraseñas distintas que compartan el mismo prefijo de 72 podrían
// funcionar igual, sin que el usuario se entere.
const MAX_PASSWORD = 72;

class UsuarioBaseDto {
  @ApiProperty({ example: "María Fernández" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @ApiProperty({ example: "maria@gmail.com" })
  @IsEmail()
  correo!: string;

  @ApiProperty({ enum: ROLES, isArray: true, example: ["emprendedor"] })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(ROLES, { each: true })
  roles!: Role[];
}

export class CreateUsuarioDto extends UsuarioBaseDto {
  @ApiProperty({ example: "Sup3rSegura!", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(MAX_PASSWORD)
  password!: string;
}

export class UpdateUsuarioDto extends UsuarioBaseDto {
  @ApiPropertyOptional({ example: "Sup3rSegura!", minLength: 8, description: "Si se omite, la contraseña no cambia." })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(MAX_PASSWORD)
  password?: string;
}
