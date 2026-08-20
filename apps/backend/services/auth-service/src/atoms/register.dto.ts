import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Match } from "./match.decorator";

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

  // Se valida aquí también (no solo en el gateway ni en el front) y se descarta:
  // register() solo lee nombre/correo/password, así que confirmPassword nunca llega a la BD.
  @ApiProperty({ example: "Sup3rSegura!", description: "Debe ser idéntica a password" })
  @IsString()
  @Match("password", { message: "Las contraseñas no coinciden." })
  confirmPassword!: string;
}
