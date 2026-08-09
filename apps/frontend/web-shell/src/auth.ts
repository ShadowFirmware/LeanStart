import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DEMO_ACCOUNTS } from "@leanstart/commons";
import type { Role } from "@leanstart/commons";
import type { Privilegio } from "@/types/next-auth";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// El secreto NUNCA se hornea en el bundle. En modo demo (explícitamente inseguro)
// se permite un secreto efímero; fuera de demo es obligatorio definir AUTH_SECRET,
// de lo contrario cualquiera podría firmar un JWT con rol "administrador".
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (isDemoMode ? "demo-mode-insecure-secret-not-for-production" : undefined);

if (!authSecret) {
  throw new Error(
    "AUTH_SECRET no está definido. Define AUTH_SECRET (o NEXTAUTH_SECRET) en el entorno, " +
      "o activa NEXT_PUBLIC_DEMO_MODE=true para el modo demo."
  );
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Sin backend real, en modo demo se permite loguearse con cuentas
        // demo fijas (ver DEMO_ACCOUNTS en commons/src/lib/demo.ts) antes de
        // intentar la API. Nunca se usan fuera de modo demo.
        if (isDemoMode) {
          const demoAccount = DEMO_ACCOUNTS.find(
            (account) =>
              account.email === credentials.email && account.password === credentials.password
          );
          if (demoAccount) {
            return {
              id: demoAccount.id,
              name: demoAccount.name,
              email: demoAccount.email,
              rol: demoAccount.rol,
              privilegios: [],
            };
          }
        }

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) return null;

          const data = await res.json();

          return {
            id: String(data.user.id),
            name: String(data.user.nombre),
            email: String(data.user.email),
            rol: data.user.rol as Role,
            privilegios: data.user.privilegios ?? [],
            accessToken: String(data.accessToken),
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.privilegios = user.privilegios;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as Role;
      session.user.privilegios = token.privilegios as Privilegio[];
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
