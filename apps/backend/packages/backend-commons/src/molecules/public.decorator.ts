import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "leanstart:public";

/** Marca una ruta del api-gateway como accesible sin JWT (login, registro, galería pública, docs). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
