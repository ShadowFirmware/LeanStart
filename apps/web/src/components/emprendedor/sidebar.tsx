"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, Bell, LogOut } from "lucide-react";
import { useNotificacionesStore } from "@/store/notificaciones";

interface EmprendedorSidebarProps {
  userName: string;
  userEmail: string;
}

export function EmprendedorSidebar({ userName, userEmail }: EmprendedorSidebarProps) {
  const pathname = usePathname();
  const noLeidas = useNotificacionesStore((s) => s.notificaciones.filter((n) => !n.leida).length);

  const navItems = [
    { href: "/emprendedor/dashboard",       label: "Dashboard",       icon: LayoutDashboard, badge: 0 },
    { href: "/emprendedor/empresas",         label: "Mis Empresas",    icon: Building2,       badge: 0 },
    { href: "/emprendedor/notificaciones",   label: "Notificaciones",  icon: Bell,            badge: noLeidas },
  ];

  return (
    <aside
      className="flex flex-col w-60 h-full border-r shrink-0"
      style={{
        backgroundColor: "#0D0C10",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center px-5 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link href="/emprendedor/dashboard">
          <Image
            src="/logo.png"
            alt="LeanStart"
            width={110}
            height={110}
            style={{ height: "auto" }}
            unoptimized
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
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
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? "#9A62FA" : "currentColor" }}
              />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: "#9A62FA", color: "#FBFBFC" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="px-3 pb-4 border-t pt-3 shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: "rgba(154,98,250,0.2)", color: "#9A62FA" }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>
              {userName}
            </p>
            <p className="text-xs truncate" style={{ color: "#7E7C86" }}>
              {userEmail}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: "#7E7C86" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#7E7C86")
          }
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
