import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/types";

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

  // Rutas públicas
  if (pathname === "/login" || pathname === "/") {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
