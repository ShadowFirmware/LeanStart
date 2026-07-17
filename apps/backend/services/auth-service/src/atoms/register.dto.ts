import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Juan Pérez" })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ example: "juan@gmail.com" })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: "Sup3rSegura!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
