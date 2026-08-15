import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";

const MAX_HISTORIAL = 50;
const MAX_MENSAJE_LEN = 4000;

export class MensajeChatItemDto {
  @ApiProperty({ enum: ["user", "assistant"] })
  @IsIn(["user", "assistant"])
  rol!: "user" | "assistant";

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MENSAJE_LEN)
  contenido!: string;
}

export class MensajeChatDto {
  @ApiPropertyOptional({ description: "Empresa sobre la que trabaja la conversación; ausente mientras aún no se crea." })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @ApiProperty({ type: [MensajeChatItemDto] })
  @IsArray()
  @ArrayMaxSize(MAX_HISTORIAL)
  @ValidateNested({ each: true })
  @Type(() => MensajeChatItemDto)
  historial!: MensajeChatItemDto[];
}
