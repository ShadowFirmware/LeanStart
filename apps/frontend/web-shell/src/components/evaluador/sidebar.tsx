"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cerrarSesionBackend } from "@leanstart/commons";
import { LayoutDashboard, Building2, History, LogOut, Menu, X } from "lucide-react";
import { SidebarUser } from "@/components/perfil/sidebar-user";
import { Logo } from "@/components/logo";

interface EvaluadorSidebarProps {
  userName: string;
  userEmail: string;
}

const NAV_ITEMS = [
  { href: "/evaluador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluador/empresas", label: "Empresas", icon: Building2 },
  { href: "/evaluador/historial", label: "Historial", icon: History },
];

export function EvaluadorSidebar({ userName, userEmail }: EvaluadorSidebarProps) {
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
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Link href="/evaluador/dashboard" onClick={() => setOpen(false)}>
          <Logo height={26} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)" }}
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
                color: isActive ? "var(--text-strong)" : "var(--text-dim)",
                backgroundColor: isActive ? "var(--brand-tint)" : "transparent",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "var(--brand)" : "currentColor" }} />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="px-3 pb-4 border-t pt-3 shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <SidebarUser rol="evaluador" userName={userName} userEmail={userEmail} onNavigate={() => setOpen(false)} />
        <button
          type="button"
          onClick={() => { cerrarSesionBackend().finally(() => signOut({ callbackUrl: "/login" })); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
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
          backgroundColor: "var(--shell-header)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: "var(--text-strong)", backgroundColor: "var(--hover-surface)" }}
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href="/evaluador/dashboard" className="flex items-center">
          <Logo height={22} />
        </Link>
        <div className="w-9 h-9" />
      </header>

      {/* Sidebar desktop (md+) */}
      <aside
        className="hidden md:flex flex-col w-60 h-full border-r shrink-0"
        style={{
          backgroundColor: "var(--shell)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-sidebar)",
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
              backgroundColor: "var(--shell)",
              borderColor: "var(--border-subtle)",
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
