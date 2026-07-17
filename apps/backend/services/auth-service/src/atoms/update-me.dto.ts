import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateMeDto {
  @ApiPropertyOptional({ example: "Juan Pérez" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: "juan.perez@gmail.com" })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ description: "Avatar en data URL (comprimido)." })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
