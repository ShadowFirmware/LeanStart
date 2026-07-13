"use client";

import Link from "next/link";
import { useCurrentUser, usePerfilStore, useHasHydrated, type Role } from "@leanstart/commons";

interface SidebarUserProps {
  rol: Role;
  /** Nombre/correo del layout (sesión). Se usan como respaldo si no hay override local. */
  userName: string;
  userEmail: string;
  onNavigate?: () => void;
}

/**
 * Bloque de usuario del sidebar: enlaza a "/{rol}/perfil" y refleja los cambios
 * que el usuario haya guardado en su perfil (nombre, correo, avatar) desde el
 * store local, con respaldo en los datos de la sesión.
 */
export function SidebarUser({ rol, userName, userEmail, onNavigate }: SidebarUserProps) {
  const currentUser = useCurrentUser();
  const hydrated = useHasHydrated();
  const override = usePerfilStore((s) => (currentUser ? s.perfiles[currentUser.id] : undefined));

  const displayName = (hydrated && override?.nombre) || userName;
  const displayEmail = (hydrated && override?.correo) || userEmail;
  const displayAvatar = hydrated ? override?.avatarUrl : undefined;

  return (
    <Link
      href={`/${rol}/perfil`}
      onClick={onNavigate}
      className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1 transition-colors hover:brightness-125"
      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden"
        style={{ backgroundColor: "rgba(154,98,250,0.2)", color: "#9A62FA" }}
      >
        {displayAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>{displayName}</p>
        <p className="text-xs truncate" style={{ color: "#7E7C86" }}>{displayEmail}</p>
      </div>
    </Link>
  );
}
