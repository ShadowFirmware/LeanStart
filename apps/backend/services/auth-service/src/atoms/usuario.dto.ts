import { ApiProperty } from "@nestjs/swagger";
import type { Role } from "@leanstart/backend-commons";
import { IsEmail, IsIn, IsString, MinLength } from "class-validator";

const ROLES: Role[] = ["administrador", "emprendedor", "mentor", "evaluador"];

export class CreateUsuarioDto {
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

export class UpdateUsuarioDto extends CreateUsuarioDto {}
