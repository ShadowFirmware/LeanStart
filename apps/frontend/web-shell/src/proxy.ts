import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Role } from "@leanstart/commons";

const ROLE_HOME: Record<Role, string> = {
  emprendedor: "/emprendedor/dashboard",
  mentor: "/mentor/dashboard",
  evaluador: "/evaluador/dashboard",
  administrador: "/administrador/dashboard",
};

// Prefijos de ruta que pertenecen a cada rol
const ROLE_PREFIXES: Record<Role, string> = {
  emprendedor: "/emprendedor",
  mentor: "/mentor",
  evaluador: "/evaluador",
  administrador: "/administrador",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Bypass de autenticación SOLO en modo demo explícito (NEXT_PUBLIC_DEMO_MODE=true):
  // no exige sesión para entrar a rutas protegidas (useCurrentUser cae a un usuario
  // demo por ruta). Pero si SÍ hay una sesión real (p. ej. alguien entró con
  // credenciales reales, como la cuenta demo de Daniel), respetamos el flujo normal
  // de "sácalo de /login hacia su rol" — si no, tras loguearse con éxito no pasa
  // nada visible, porque este bypass nunca redirige.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    if (pathname === "/login" && session?.user?.rol) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.user.rol], req.url));
    }
    return NextResponse.next();
  }

  // Rutas públicas
  if (pathname === "/login" || pathname === "/" || pathname === "/registro") {
    if (session?.user?.rol) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[session.user.rol], req.url)
      );
    }
    return NextResponse.next();
  }

  // Rutas protegidas: usuario sin sesión → login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const rol = session.user.rol;

  // Verificar que el usuario acceda solo a las rutas de su rol
  for (const [role, prefix] of Object.entries(ROLE_PREFIXES) as [Role, string][]) {
    if (pathname.startsWith(prefix) && rol !== role) {
      return NextResponse.redirect(new URL(ROLE_HOME[rol], req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
