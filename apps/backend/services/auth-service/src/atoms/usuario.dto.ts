import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Role } from "@leanstart/backend-commons";
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

const ROLES: Role[] = ["administrador", "emprendedor", "mentor", "evaluador"];

class UsuarioBaseDto {
  @ApiProperty({ example: "María Fernández" })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ example: "maria@gmail.com" })
  @IsEmail()
  correo!: string;

  @ApiProperty({ enum: ROLES, example: "emprendedor" })
  @IsIn(ROLES)
  rol!: Role;
}

export class CreateUsuarioDto extends UsuarioBaseDto {
  @ApiProperty({ example: "Sup3rSegura!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateUsuarioDto extends UsuarioBaseDto {
  @ApiPropertyOptional({ example: "Sup3rSegura!", minLength: 8, description: "Si se omite, la contraseña no cambia." })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
