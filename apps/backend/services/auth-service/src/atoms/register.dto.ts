import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Juan Pérez" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @ApiProperty({ example: "juan@gmail.com" })
  @IsEmail()
  correo!: string;

  // bcrypt (usado para el hash) ignora en silencio todo lo que pase de 72 bytes.
  @ApiProperty({ example: "Sup3rSegura!", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
