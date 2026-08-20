import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsObject, IsString } from "class-validator";

/**
 * Espeja el evento `email.received` que manda Resend Inbound — el api-gateway
 * ya validó la firma antes de reenviarlo, así que acá solo se valida forma.
 * Docs: https://resend.com/docs/dashboard/receiving/introduction
 */
export class EventoCorreoEntranteDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsDateString()
  created_at!: string;

  @ApiProperty()
  @IsObject()
  data!: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    /// Cuerpo del correo. `text` es el que se guarda; `html` se ignora a
    /// propósito — archivar HTML ajeno para pintarlo después en el panel del
    /// administrador sería inyectar marcado de terceros en nuestra UI.
    text?: string;
    html?: string;
    attachments?: { id: string; filename: string; content_type: string }[];
  };
}
