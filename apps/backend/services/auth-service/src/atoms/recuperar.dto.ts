import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class RecuperarDto {
  @ApiProperty({ example: "juan@gmail.com" })
  @IsEmail()
  correo!: string;
}
