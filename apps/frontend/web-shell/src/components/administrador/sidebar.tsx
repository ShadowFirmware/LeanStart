"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { cerrarSesionBackend } from "@leanstart/commons";
import {
  LayoutDashboard, Users, Building2, ShieldCheck,
  ClipboardList, TrendingUp, BarChart3, LogOut, Menu, X,
} from "lucide-react";
import { SidebarUser } from "@/components/perfil/sidebar-user";

interface AdministradorSidebarProps {
  userName: string;
  userEmail: string;
}

const NAV_ITEMS = [
  { href: "/administrador/dashboard",             label: "Dashboard",              icon: LayoutDashboard },
  { href: "/administrador/usuarios",               label: "Usuarios",               icon: Users },
  { href: "/administrador/empresas",               label: "Empresas",               icon: Building2 },
  { href: "/administrador/roles-privilegios",      label: "Roles y Privilegios",    icon: ShieldCheck },
  { href: "/administrador/criterios-evaluacion",   label: "Criterios de Evaluación", icon: ClipboardList },
  { href: "/administrador/viabilidad",             label: "Viabilidad",             icon: TrendingUp },
  { href: "/administrador/reportes",               label: "Reportes",               icon: BarChart3 },
];

export function AdministradorSidebar({ userName, userEmail }: AdministradorSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Evita scroll del body cuando el drawer está abierto en mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const SidebarInner = (
    <>
      {/* Logo + close (solo mobile) */}
      <div
        className="h-16 flex items-center justify-between px-5 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link href="/administrador/dashboard" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="LeanStart" width={110} height={110} style={{ height: "auto" }} unoptimized />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)" }}
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive ? "#F2F0F7" : "#7E7C86",
                backgroundColor: isActive ? "rgba(154,98,250,0.12)" : "transparent",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "#9A62FA" : "currentColor" }} />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="px-3 pb-4 border-t pt-3 shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <SidebarUser rol="administrador" userName={userName} userEmail={userEmail} onNavigate={() => setOpen(false)} />
        <button
          type="button"
          onClick={() => { cerrarSesionBackend().finally(() => signOut({ callbackUrl: "/login" })); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: "#7E7C86" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Top bar - solo mobile */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(13,12,16,0.85)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: "#F2F0F7", backgroundColor: "rgba(255,255,255,0.04)" }}
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href="/administrador/dashboard" className="flex items-center">
          <Image src="/logo.png" alt="LeanStart" width={90} height={90} style={{ height: "auto" }} unoptimized />
        </Link>
        <div className="w-9 h-9" />
      </header>

      {/* Sidebar desktop (md+) */}
      <aside
        className="hidden md:flex flex-col w-60 h-full border-r shrink-0"
        style={{
          backgroundColor: "#0D0C10",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {SidebarInner}
      </aside>

      {/* Drawer mobile (overlay) */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className="md:hidden fixed top-0 left-0 z-50 flex flex-col w-64 h-full border-r"
            style={{
              backgroundColor: "#0D0C10",
              borderColor: "rgba(255,255,255,0.06)",
            }}
            role="dialog"
            aria-modal="true"
          >
            {SidebarInner}
          </aside>
        </>
      )}
    </>
  );
}
