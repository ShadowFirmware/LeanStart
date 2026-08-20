import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateMeDto {
  @ApiPropertyOptional({ example: "Juan Pérez" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;

  @ApiPropertyOptional({ example: "juan.perez@gmail.com" })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ description: "URL pública del avatar en S3 (la fija POST /auth/me/avatar; aquí solo se permite limpiarla)." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
