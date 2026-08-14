import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class RestablecerDto {
  @ApiProperty({ description: "Token recibido por correo" })
  @IsString()
  token!: string;

  // bcrypt (usado para el hash) ignora en silencio todo lo que pase de 72 bytes.
  @ApiProperty({ example: "Sup3rSegura!", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
