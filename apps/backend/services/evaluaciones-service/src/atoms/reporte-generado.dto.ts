import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export class RegistrarReporteDto {
  @ApiProperty()
  @IsString()
  empresaId!: string;

  @ApiProperty()
  @IsString()
  empresaNombre!: string;

  @ApiProperty({ enum: ["boleta", "canvas"] })
  @IsIn(["boleta", "canvas"])
  tipo!: "boleta" | "canvas";

  @ApiProperty({ description: "Nombre de quien generó el reporte (administrador en sesión)" })
  @IsString()
  generadoPor!: string;
}
