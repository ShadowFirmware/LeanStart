import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpException");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Errores que no son HttpException (p. ej. PayloadTooLargeError de body-parser,
    // lanzado antes de que la petición llegue a Nest) igual traen su propio
    // status/statusCode — sin esto, se disfrazaban de 500 genérico.
    const statusDeErrorCrudo =
      exception && typeof exception === "object"
        ? (exception as { status?: number; statusCode?: number }).status ??
          (exception as { status?: number; statusCode?: number }).statusCode
        : undefined;

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : (statusDeErrorCrudo ?? HttpStatus.INTERNAL_SERVER_ERROR);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    // En 500 crudos (no HttpException) nunca se expone el mensaje interno al cliente
    // (p. ej. detalles de una query de Prisma) — solo queda logueado server-side.
    const esErrorCrudoNoHttp = !(exception instanceof HttpException);
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: esErrorCrudoNoHttp ? "Error interno del servidor." : undefined };

    response.status(status).json(
      typeof body === "string" ? { statusCode: status, message: body } : { statusCode: status, ...body }
    );
  }
}
