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
    const rolesDemo = session?.user?.roles?.length ? session.user.roles : session?.user?.rol ? [session.user.rol] : undefined;
    if (pathname === "/login" && rolesDemo?.length) {
      return NextResponse.redirect(new URL(ROLE_HOME[rolesDemo[0]], req.url));
    }
    return NextResponse.next();
  }

  // Rutas públicas
  if (
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/registro" ||
    pathname === "/recuperar" ||
    pathname === "/restablecer"
  ) {
    if (session?.user?.roles?.length) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[session.user.roles[0]], req.url)
      );
    }
    return NextResponse.next();
  }

  // Rutas protegidas: usuario sin sesión → login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const roles = session.user.roles?.length ? session.user.roles : [session.user.rol];

  // Un usuario puede tener varios roles a la vez: acceder a un prefijo alcanza con
  // que UNO de sus roles lo cubra. Si el pathname no coincide con ningún prefijo
  // conocido, se deja pasar (rutas compartidas fuera de los 4 grupos por rol).
  for (const [role, prefix] of Object.entries(ROLE_PREFIXES) as [Role, string][]) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[roles[0]], req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
