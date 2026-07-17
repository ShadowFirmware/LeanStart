import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "demo@leanstart.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Sup3rSegura!" })
  @IsString()
  @MinLength(1)
  password!: string;
}
