"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Building2, Bell, History, Users, ShieldCheck,
  ClipboardList, TrendingUp, BarChart3, LogOut, Menu, X,
} from "lucide-react";
import type { Role } from "@leanstart/commons";
import { cerrarSesionBackend, cerrarSesionUnaVez, useHasHydrated } from "@leanstart/commons";
import { useNotificacionesStore } from "@leanstart/notificaciones-front";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { SidebarUser } from "@/components/perfil/sidebar-user";
import { Logo } from "@/components/logo";

const ESTADOS_PENDIENTES_ASIGNACION = ["pendiente_mentoria", "pendiente_evaluacion"];

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  dot?: boolean;
}

const ROL_LABEL: Record<Role, string> = {
  administrador: "Administrador",
  emprendedor: "Emprendedor",
  mentor: "Mentor",
  evaluador: "Evaluador",
};

interface CombinedSidebarProps {
  roles: Role[];
  userName: string;
  userEmail: string;
}

/**
 * Sidebar único para usuarios con uno o varios roles a la vez. Con un solo rol
 * se ve idéntico a los sidebars dedicados de siempre (mismas rutas, mismos
 * iconos); con varios, apila una sección por rol con un encabezado que lo
 * identifica — todas las secciones quedan disponibles simultáneamente, no es
 * un selector para cambiar de "sombrero".
 */
export function CombinedSidebar({ roles, userName, userEmail }: CombinedSidebarProps) {
  const pathname = usePathname();
  const hydrated = useHasHydrated();
  const [open, setOpen] = useState(false);

  const noLeidasEmprendedor = useNotificacionesStore(
    (s) => s.notificaciones.filter((n) => (n.destinatario ?? "emprendedor") === "emprendedor" && !n.leida).length
  );
  const noLeidasMentor = useNotificacionesStore(
    (s) => s.notificaciones.filter((n) => n.destinatario === "mentor" && !n.leida).length
  );
  const empresas = useEmpresasStore((s) => s.empresas);
  const hayPendientesAsignacion = hydrated && empresas.some((e) => ESTADOS_PENDIENTES_ASIGNACION.includes(e.estado));

  // Cierra el drawer al cambiar de ruta.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  function navItemsDe(rol: Role): NavItem[] {
    switch (rol) {
      case "emprendedor":
        return [
          { href: "/emprendedor/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/emprendedor/empresas", label: "Mis Empresas", icon: Building2 },
          { href: "/emprendedor/notificaciones", label: "Notificaciones", icon: Bell, badge: hydrated ? noLeidasEmprendedor : 0 },
        ];
      case "mentor":
        return [
          { href: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/mentor/empresas", label: "Empresas", icon: Building2 },
          { href: "/mentor/historial", label: "Historial", icon: History },
          { href: "/mentor/notificaciones", label: "Notificaciones", icon: Bell, badge: hydrated ? noLeidasMentor : 0 },
        ];
      case "evaluador":
        return [
          { href: "/evaluador/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/evaluador/empresas", label: "Empresas", icon: Building2 },
          { href: "/evaluador/historial", label: "Historial", icon: History },
        ];
      case "administrador":
        return [
          { href: "/administrador/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/administrador/usuarios", label: "Usuarios", icon: Users },
          { href: "/administrador/empresas", label: "Empresas", icon: Building2, dot: hayPendientesAsignacion },
          { href: "/administrador/roles-privilegios", label: "Roles y Privilegios", icon: ShieldCheck },
          { href: "/administrador/criterios-evaluacion", label: "Criterios de Evaluación", icon: ClipboardList },
          { href: "/administrador/viabilidad", label: "Viabilidad", icon: TrendingUp },
          { href: "/administrador/reportes", label: "Reportes", icon: BarChart3 },
        ];
    }
  }

  const mostrarEncabezados = roles.length > 1;
  const rolPrincipal = roles[0];

  // Notificación combinada del header móvil: suma de todas las secciones que tengan bandeja.
  const noLeidasTotal = (roles.includes("emprendedor") ? (hydrated ? noLeidasEmprendedor : 0) : 0)
    + (roles.includes("mentor") ? (hydrated ? noLeidasMentor : 0) : 0);
  const notificacionesHref = roles.includes("emprendedor")
    ? "/emprendedor/notificaciones"
    : roles.includes("mentor")
      ? "/mentor/notificaciones"
      : undefined;

  const SidebarInner = (
    <>
      <div
        className="h-16 flex items-center justify-between px-5 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Link href={`/${rolPrincipal}/dashboard`} onClick={() => setOpen(false)}>
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

      <nav className="flex-1 px-3 py-4 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {roles.map((rol) => (
          <div key={rol} className="flex flex-col gap-0.5">
            {mostrarEncabezados && (
              <p
                className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-dim)" }}
              >
                Como {ROL_LABEL[rol]}
              </p>
            )}
            {navItemsDe(rol).map(({ href, label, icon: Icon, badge, dot }) => {
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
                  <span className="relative shrink-0">
                    <Icon className="w-4 h-4" style={{ color: isActive ? "var(--brand)" : "currentColor" }} />
                    {dot && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#EF4444", boxShadow: "0 0 0 2px var(--shell)" }}
                        aria-label="Hay empresas pendientes de asignar mentor o evaluador"
                      />
                    )}
                  </span>
                  <span className="flex-1 truncate">{label}</span>
                  {!!badge && badge > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0"
                      style={{ backgroundColor: "var(--brand)", color: "var(--brand-fg)" }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className="px-3 pb-4 border-t pt-3 shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <SidebarUser rol={rolPrincipal} userName={userName} userEmail={userEmail} onNavigate={() => setOpen(false)} />
        <button
          type="button"
          onClick={() => { cerrarSesionBackend().finally(cerrarSesionUnaVez); }}
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
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 border-b backdrop-blur-md"
        style={{ backgroundColor: "var(--shell-header)", borderColor: "var(--border-subtle)" }}
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
        <Link href={`/${rolPrincipal}/dashboard`} className="flex items-center">
          <Logo height={22} />
        </Link>
        {notificacionesHref && noLeidasTotal > 0 ? (
          <Link
            href={notificacionesHref}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ color: "var(--text-strong)", backgroundColor: "var(--hover-surface)" }}
            aria-label="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute -top-0.5 -right-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{ backgroundColor: "var(--brand)", color: "var(--brand-fg)" }}
            >
              {noLeidasTotal}
            </span>
          </Link>
        ) : (
          <div className="w-9 h-9" />
        )}
      </header>

      <aside
        className="hidden md:flex flex-col w-60 h-full border-r shrink-0"
        style={{ backgroundColor: "var(--shell)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sidebar)" }}
      >
        {SidebarInner}
      </aside>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className="md:hidden fixed top-0 left-0 z-50 flex flex-col w-64 h-full border-r"
            style={{ backgroundColor: "var(--shell)", borderColor: "var(--border-subtle)" }}
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
