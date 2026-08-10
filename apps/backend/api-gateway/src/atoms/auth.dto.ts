import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

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

export class LoginDto {
  @ApiProperty({ example: "demo@leanstart.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Leanstart123!" })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RecuperarDto {
  @ApiProperty({ example: "juan@gmail.com" })
  @IsEmail()
  correo!: string;
}

export class GenerarSemillaDto {
  @ApiProperty({ example: "Daniel", description: "Nombre que el emprendedor le dirá a Alexa para identificarse" })
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class ValidarSemillaDto {
  @ApiProperty({ example: "Daniel" })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ example: "4829" })
  @IsString()
  @Length(4, 4)
  seed!: string;
}
