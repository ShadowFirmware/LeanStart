"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, Rocket, GraduationCap, ClipboardCheck, Pencil, Check, Plus, Trash2, UserCog,
  Users, Building2, Package, LayoutTemplate, Lightbulb, BarChart3,
} from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Input, Textarea,
} from "@leanstart/commons";
import type { Role, Modulo, Accion } from "@leanstart/commons";
import { modoDemo, useUsuariosStore } from "@leanstart/commons";
import { useRolesStore, type RolPersonalizado } from "../store/roles";
import { usePrivilegiosStore, MODULOS, ACCIONES } from "../store/privilegios";

const ROLES_CONFIG: Record<Role, { label: string; color: string; icon: React.ElementType }> = {
  administrador: { label: "Administrador", color: "#9A62FA", icon: ShieldCheck },
  emprendedor: { label: "Emprendedor", color: "#3B82F6", icon: Rocket },
  mentor: { label: "Mentor", color: "#F59E0B", icon: GraduationCap },
  evaluador: { label: "Evaluador", color: "#10B981", icon: ClipboardCheck },
};

const ROLES_ORDEN: Role[] = ["administrador", "emprendedor", "mentor", "evaluador"];

const MODULO_CONFIG: Record<Modulo, { label: string; icon: React.ElementType }> = {
  usuarios: { label: "Usuarios", icon: Users },
  empresas: { label: "Empresas", icon: Building2 },
  productos: { label: "Productos", icon: Package },
  lean_canvas: { label: "Lean Canvas", icon: LayoutTemplate },
  hipotesis: { label: "Hipótesis", icon: Lightbulb },
  mentorias: { label: "Mentorías", icon: GraduationCap },
  evaluaciones: { label: "Evaluaciones", icon: ClipboardCheck },
  reportes: { label: "Reportes", icon: BarChart3 },
};

const ACCION_LABELS: Record<Accion, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  aprobar: "Aprobar",
  exportar: "Exportar",
};

const MAX_DESCRIPCION = 240;
const MAX_NOMBRE = 40;

type Seccion = "roles" | "privilegios";

const SECCIONES: { value: Seccion; label: string }[] = [
  { value: "roles", label: "Roles" },
  { value: "privilegios", label: "Privilegios" },
];

/** Columnas de la matriz de privilegios: módulo (fijo) + una por acción. */
const GRID_COLS = "minmax(150px, 1.6fr) repeat(6, minmax(64px, 1fr))";

export function RolesPrivilegiosView() {
  const [seccion, setSeccion] = useState<Seccion>("roles");
  const descripciones = useRolesStore((s) => s.descripciones);
  const actualizarDescripcion = useRolesStore((s) => s.actualizarDescripcion);
  const personalizados = useRolesStore((s) => s.personalizados);
  const agregarRol = useRolesStore((s) => s.agregarRol);
  const editarRolPersonalizado = useRolesStore((s) => s.editarRolPersonalizado);
  const eliminarRolPersonalizado = useRolesStore((s) => s.eliminarRolPersonalizado);
  const usuarios = useUsuariosStore((s) => s.usuarios);

  const inicializarRolPrivilegios = usePrivilegiosStore((s) => s.inicializarRol);
  const eliminarRolPrivilegios = usePrivilegiosStore((s) => s.eliminarRol);

  // Editar descripción de un rol del sistema
  const [editSistemaTarget, setEditSistemaTarget] = useState<Role | null>(null);
  const [draftDescripcion, setDraftDescripcion] = useState("");

  // Crear / editar un rol personalizado
  const [formPersonalizado, setFormPersonalizado] = useState<{ id: string | null; nombre: string; descripcion: string } | null>(null);

  // Eliminar un rol personalizado
  const [deleteTarget, setDeleteTarget] = useState<RolPersonalizado | null>(null);

  const [rolPrivilegios, setRolPrivilegios] = useState<string>("administrador");
  const privilegios = usePrivilegiosStore((s) => s.privilegios);
  const cargarPrivilegios = usePrivilegiosStore((s) => s.cargarPrivilegios);
  const toggleAccion = usePrivilegiosStore((s) => s.toggleAccion);
  const toggleModuloCompleto = usePrivilegiosStore((s) => s.toggleModuloCompleto);
  const toggleAccionColumna = usePrivilegiosStore((s) => s.toggleAccionColumna);
  const setTodos = usePrivilegiosStore((s) => s.setTodos);

  useEffect(() => {
    if (!modoDemo()) cargarPrivilegios(rolPrivilegios).catch(() => toast.error("No se pudieron cargar los privilegios."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolPrivilegios]);

  function abrirEditarSistema(rol: Role) {
    setEditSistemaTarget(rol);
    setDraftDescripcion(descripciones[rol]);
  }

  function guardarSistema() {
    if (!editSistemaTarget) return;
    actualizarDescripcion(editSistemaTarget, draftDescripcion.trim());
    toast.success(`Descripción de "${ROLES_CONFIG[editSistemaTarget].label}" actualizada.`);
    setEditSistemaTarget(null);
  }

  function abrirCrearRol() {
    setFormPersonalizado({ id: null, nombre: "", descripcion: "" });
  }

  function abrirEditarPersonalizado(rol: RolPersonalizado) {
    setFormPersonalizado({ id: rol.id, nombre: rol.nombre, descripcion: rol.descripcion });
  }

  function guardarPersonalizado() {
    if (!formPersonalizado) return;
    const nombre = formPersonalizado.nombre.trim();
    const descripcion = formPersonalizado.descripcion.trim();
    if (nombre.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (descripcion.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres.");
      return;
    }

    if (formPersonalizado.id) {
      editarRolPersonalizado(formPersonalizado.id, { nombre, descripcion });
      toast.success(`Rol "${nombre}" actualizado.`);
    } else {
      const id = agregarRol({ nombre, descripcion });
      inicializarRolPrivilegios(id);
      toast.success(`Rol "${nombre}" creado. Ya puedes configurar sus privilegios.`);
    }
    setFormPersonalizado(null);
  }

  function confirmarEliminar() {
    if (!deleteTarget) return;
    eliminarRolPersonalizado(deleteTarget.id);
    eliminarRolPrivilegios(deleteTarget.id);
    if (rolPrivilegios === deleteTarget.id) setRolPrivilegios("administrador");
    toast.success(`Rol "${deleteTarget.nombre}" eliminado.`);
    setDeleteTarget(null);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Roles y Privilegios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Administra los roles funcionales y los privilegios dinámicos por módulo y acción.
          </p>
        </div>
        {seccion === "roles" && (
          <Button
            onClick={abrirCrearRol}
            className="h-9 px-4 text-sm font-medium border-0 shrink-0 justify-center w-full sm:w-auto"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            <Plus className="w-4 h-4" />
            Agregar rol
          </Button>
        )}
      </div>

      {/* Tabs de sección */}
      <div
        className="flex items-center gap-1 rounded-lg p-1 w-fit"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
      >
        {SECCIONES.map(({ value, label }) => {
          const isActive = seccion === value;
          return (
            <button
              key={value}
              onClick={() => setSeccion(value)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "rgba(154,98,250,0.18)" : "transparent",
                color: isActive ? "var(--text-strong)" : "var(--text-dim)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {seccion === "roles" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES_ORDEN.map((rol) => {
            const cfg = ROLES_CONFIG[rol];
            const Icon = cfg.icon;
            const count = usuarios.filter((u) => u.rol === rol).length;
            return (
              <div
                key={rol}
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cfg.color}1A`, border: `1px solid ${cfg.color}26` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{cfg.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                        {count} {count === 1 ? "usuario" : "usuarios"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={() => abrirEditarSistema(rol)}
                    style={{ color: "var(--text-dim)" }}
                    aria-label={`Editar descripción de ${cfg.label}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {descripciones[rol]}
                </p>
              </div>
            );
          })}

          {personalizados.map((rol) => (
            <div
              key={rol.id}
              className="rounded-xl p-5 flex flex-col gap-4"
              style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${rol.color}1A`, border: `1px solid ${rol.color}26` }}
                  >
                    <UserCog className="w-5 h-5" style={{ color: rol.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>{rol.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Rol personalizado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => abrirEditarPersonalizado(rol)}
                    style={{ color: "var(--text-dim)" }}
                    aria-label={`Editar rol ${rol.nombre}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(rol)}
                    style={{ color: "var(--text-dim)" }}
                    aria-label={`Eliminar rol ${rol.nombre}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {rol.descripcion}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Selector de rol con ícono + conteo de usuarios */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {ROLES_ORDEN.map((rol) => {
              const cfg = ROLES_CONFIG[rol];
              const RolIcon = cfg.icon;
              const isActive = rolPrivilegios === rol;
              const count = usuarios.filter((u) => u.rol === rol).length;
              return (
                <button
                  key={rol}
                  onClick={() => setRolPrivilegios(rol)}
                  className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: isActive ? `${cfg.color}1F` : "var(--hover-surface-2)",
                    color: isActive ? "var(--text-strong)" : "var(--text-dim)",
                    border: `1px solid ${isActive ? `${cfg.color}66` : "var(--border-subtle)"}`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cfg.color}22` }}
                  >
                    <RolIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  </span>
                  {cfg.label}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--border-subtle)", color: "var(--muted-foreground)" }}>
                    {count}
                  </span>
                </button>
              );
            })}
            {personalizados.map((rol) => {
              const isActive = rolPrivilegios === rol.id;
              return (
                <button
                  key={rol.id}
                  onClick={() => setRolPrivilegios(rol.id)}
                  className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: isActive ? `${rol.color}1F` : "var(--hover-surface-2)",
                    color: isActive ? "var(--text-strong)" : "var(--text-dim)",
                    border: `1px solid ${isActive ? `${rol.color}66` : "var(--border-subtle)"}`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${rol.color}22` }}
                  >
                    <UserCog className="w-3.5 h-3.5" style={{ color: rol.color }} />
                  </span>
                  {rol.nombre}
                </button>
              );
            })}
          </div>

          {/* Resumen de permisos + acciones rápidas */}
          {(() => {
            const rolMatriz = privilegios[rolPrivilegios] ?? {};
            const total = MODULOS.length * ACCIONES.length;
            const otorgados = MODULOS.reduce((acc, m) => acc + (rolMatriz[m as Modulo]?.length ?? 0), 0);
            const pct = Math.round((otorgados / total) * 100);
            return (
              <div
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between"
                style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>{otorgados}</span>
                    <span className="text-sm" style={{ color: "var(--text-dim)" }}>/ {total}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>Permisos otorgados</span>
                      <span className="text-xs font-medium" style={{ color: pct === 100 ? "#10B981" : "var(--brand)" }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#10B981" : "linear-gradient(90deg,var(--brand),var(--brand-2))" }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTodos(rolPrivilegios, true).catch(() => toast.error("No se pudo actualizar los privilegios."))}
                    className="text-xs font-medium px-3 h-8 rounded-lg transition-colors"
                    style={{ color: "var(--brand-accent)", backgroundColor: "var(--brand-tint)", border: "1px solid rgba(154,98,250,0.25)" }}
                  >
                    Otorgar todo
                  </button>
                  <button
                    onClick={() => setTodos(rolPrivilegios, false).catch(() => toast.error("No se pudo actualizar los privilegios."))}
                    className="text-xs font-medium px-3 h-8 rounded-lg transition-colors"
                    style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
                  >
                    Quitar todo
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Matriz interactiva módulo × acción */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="overflow-x-auto">
              <div className="min-w-[660px]">
                {/* Encabezado: acciones (clic = alternar columna completa) */}
                <div
                  className="grid items-stretch"
                  style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="sticky left-0 z-10 flex items-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-dim)", backgroundColor: "var(--surface-profile)" }}
                  >
                    Módulo
                  </div>
                  {ACCIONES.map((accion) => {
                    const enTodos = MODULOS.every((m) => (privilegios[rolPrivilegios]?.[m] ?? []).includes(accion));
                    const enAlgunos = MODULOS.some((m) => (privilegios[rolPrivilegios]?.[m] ?? []).includes(accion));
                    return (
                      <button
                        key={accion}
                        onClick={() => toggleAccionColumna(rolPrivilegios, accion).catch(() => toast.error("No se pudo actualizar los privilegios."))}
                        className="flex flex-col items-center justify-center gap-0.5 px-1 py-3 transition-colors"
                        title={enTodos ? `Quitar "${ACCION_LABELS[accion]}" de todos los módulos` : `Dar "${ACCION_LABELS[accion]}" a todos los módulos`}
                        style={{ color: enAlgunos ? "var(--brand-accent)" : "var(--text-dim)", backgroundColor: enTodos ? "rgba(154,98,250,0.08)" : "transparent" }}
                      >
                        <span className="text-[11px] font-semibold">{ACCION_LABELS[accion]}</span>
                        <span
                          className="text-[9px] px-1 rounded-full"
                          style={{ color: "var(--text-dim)", backgroundColor: "var(--border-subtle)" }}
                        >
                          {MODULOS.filter((m) => (privilegios[rolPrivilegios]?.[m] ?? []).includes(accion)).length}/{MODULOS.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filas de módulos */}
                {MODULOS.map((modulo, i) => {
                  const modCfg = MODULO_CONFIG[modulo];
                  const ModIcon = modCfg.icon;
                  const activas = privilegios[rolPrivilegios]?.[modulo] ?? [];
                  const todoActivo = activas.length === ACCIONES.length;
                  return (
                    <div
                      key={modulo}
                      className="grid items-stretch"
                      style={{ gridTemplateColumns: GRID_COLS, borderTop: i === 0 ? "none" : "1px solid var(--hover-surface)" }}
                    >
                      <button
                        onClick={() => toggleModuloCompleto(rolPrivilegios, modulo).catch(() => toast.error("No se pudo actualizar los privilegios."))}
                        className="sticky left-0 z-10 flex items-center gap-2.5 px-4 py-3 text-left transition-colors"
                        style={{ backgroundColor: "var(--surface-profile)" }}
                        title={todoActivo ? "Quitar todos los permisos del módulo" : "Otorgar todos los permisos del módulo"}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: todoActivo ? "rgba(154,98,250,0.18)" : "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.16)" }}
                        >
                          <ModIcon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>{modCfg.label}</p>
                          <p className="text-[10px]" style={{ color: activas.length === 0 ? "var(--text-dim)" : "var(--brand)" }}>
                            {activas.length}/{ACCIONES.length}
                          </p>
                        </div>
                      </button>

                      {ACCIONES.map((accion) => {
                        const activa = activas.includes(accion);
                        return (
                          <button
                            key={accion}
                            onClick={() => toggleAccion(rolPrivilegios, modulo, accion).catch(() => toast.error("No se pudo actualizar los privilegios."))}
                            className="flex items-center justify-center py-3 group"
                            aria-pressed={activa}
                            aria-label={`${activa ? "Quitar" : "Otorgar"} ${ACCION_LABELS[accion]} en ${modCfg.label}`}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                background: activa ? "linear-gradient(135deg,var(--brand),var(--brand-2))" : "var(--hover-surface-2)",
                                border: `1px solid ${activa ? "transparent" : "var(--border-hair)"}`,
                                boxShadow: activa ? "0 2px 8px rgba(154,98,250,0.4)" : "none",
                              }}
                            >
                              {activa ? (
                                <Check className="w-4 h-4" style={{ color: "var(--brand-fg)" }} />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "var(--brand)" }} />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: editar descripción de un rol del sistema */}
      <Dialog open={editSistemaTarget !== null} onOpenChange={(open) => { if (!open) setEditSistemaTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar descripción</DialogTitle>
            <DialogDescription>
              {editSistemaTarget ? `Actualiza la descripción del rol "${ROLES_CONFIG[editSistemaTarget].label}".` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={draftDescripcion}
              maxLength={MAX_DESCRIPCION}
              onChange={(e) => setDraftDescripcion(e.target.value)}
              rows={4}
              className="resize-none text-sm focus-visible:ring-0"
              style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            />
            <span className="text-xs text-right" style={{ color: "var(--text-faint)" }}>{draftDescripcion.length} / {MAX_DESCRIPCION}</span>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditSistemaTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarSistema}
              className="border-0"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: crear / editar rol personalizado */}
      <Dialog open={formPersonalizado !== null} onOpenChange={(open) => { if (!open) setFormPersonalizado(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formPersonalizado?.id ? "Editar rol" : "Agregar rol"}</DialogTitle>
            <DialogDescription>
              {formPersonalizado?.id
                ? "Actualiza el nombre y la descripción de este rol."
                : "Crea un rol personalizado y configura sus privilegios por módulo."}
            </DialogDescription>
          </DialogHeader>
          {formPersonalizado && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Nombre</label>
                <Input
                  value={formPersonalizado.nombre}
                  maxLength={MAX_NOMBRE}
                  placeholder="Ej. Coordinador académico"
                  onChange={(e) => setFormPersonalizado({ ...formPersonalizado, nombre: e.target.value })}
                  style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Descripción</label>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>{formPersonalizado.descripcion.length} / {MAX_DESCRIPCION}</span>
                </div>
                <Textarea
                  value={formPersonalizado.descripcion}
                  maxLength={MAX_DESCRIPCION}
                  rows={4}
                  placeholder="Describe qué puede hacer este rol dentro de la plataforma."
                  onChange={(e) => setFormPersonalizado({ ...formPersonalizado, descripcion: e.target.value })}
                  className="resize-none text-sm focus-visible:ring-0"
                  style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormPersonalizado(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarPersonalizado}
              className="border-0"
              style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
            >
              {formPersonalizado?.id ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminado */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `¿Seguro que quieres eliminar el rol "${deleteTarget.nombre}"? También se eliminará su configuración de privilegios. Esta acción no se puede deshacer.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
