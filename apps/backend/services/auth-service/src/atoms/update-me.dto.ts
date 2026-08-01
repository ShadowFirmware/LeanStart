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

  @ApiPropertyOptional({ description: "Avatar en data URL (comprimido)." })
  @IsOptional()
  @IsString()
  @MaxLength(3_000_000)
  avatarUrl?: string;
}
