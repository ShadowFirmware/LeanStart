"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, Users, MoreVertical, Pencil, Ban, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
  Input,
  usePagination, PaginationBar, useHasHydrated, useAccion, ViewSkeleton, usePrivilegios,
} from "@leanstart/commons";
import type { ControllerRenderProps } from "react-hook-form";
import { useUsuariosStore, type Role, type Usuario, type EstadoUsuario } from "@leanstart/commons";

const ROL_CONFIG: Record<Role, { label: string; color: string }> = {
  administrador: { label: "Administrador", color: "#9A62FA" },
  emprendedor: { label: "Emprendedor", color: "#3B82F6" },
  mentor: { label: "Mentor", color: "#F59E0B" },
  evaluador: { label: "Evaluador", color: "#10B981" },
};

const ESTADO_CONFIG: Record<EstadoUsuario, { label: string; color: string }> = {
  activo: { label: "Activo", color: "#10B981" },
  inactivo: { label: "Inactivo", color: "#7E7C86" },
};

const TODOS_LOS_ROLES = "todos";

const FILTROS_ROL = [
  { value: TODOS_LOS_ROLES, label: "Todos" },
  { value: "administrador", label: "Administrador" },
  { value: "emprendedor", label: "Emprendedor" },
  { value: "mentor", label: "Mentor" },
  { value: "evaluador", label: "Evaluador" },
];

const MAX_NOMBRE = 80;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(MAX_NOMBRE, `Máximo ${MAX_NOMBRE} caracteres`),
  correo: z.email("Correo inválido"),
  roles: z.array(z.enum(["administrador", "emprendedor", "mentor", "evaluador"])).min(1, "Selecciona al menos un rol"),
  // Obligatoria al crear, opcional al editar (vacía = no cambiarla) — la validación
  // de "obligatoria al crear" se hace a mano en onSubmit porque depende del modo.
  password: z.union([z.string().min(8, "Mínimo 8 caracteres"), z.literal("")]),
});

type FormValues = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: "var(--hover-surface)",
  border: "1px solid var(--border-hair)",
  color: "var(--text-strong)",
};

export function UsuariosView() {
  const hydrated = useHasHydrated();
  const { puede } = usePrivilegios();
  const puedeCrear = puede("usuarios", "crear");
  const puedeEditar = puede("usuarios", "editar");
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const crearUsuario = useUsuariosStore((s) => s.crearUsuario);
  const editarUsuario = useUsuariosStore((s) => s.editarUsuario);
  const activarUsuario = useUsuariosStore((s) => s.activarUsuario);
  const desactivarUsuario = useUsuariosStore((s) => s.desactivarUsuario);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState(TODOS_LOS_ROLES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { cargando: guardando, ejecutar: ejecutarGuardado } = useAccion();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", correo: "", roles: [], password: "" },
  });

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const q = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
      const coincideRol = filtroRol === TODOS_LOS_ROLES || u.roles.includes(filtroRol as Role);
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  const { page, setPage, totalPages, pageItems: usuariosPagina, pageSize, totalItems } = usePagination(usuariosFiltrados, {
    resetKey: `${busqueda}|${filtroRol}`,
  });

  function abrirCrear() {
    setEditTarget(null);
    form.reset({ nombre: "", correo: "", roles: [], password: "" });
    setShowPassword(false);
    setDialogOpen(true);
  }

  function abrirEditar(usuario: Usuario) {
    setEditTarget(usuario);
    form.reset({ nombre: usuario.nombre, correo: usuario.correo, roles: usuario.roles, password: "" });
    setShowPassword(false);
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    if (!editTarget && !values.password) {
      form.setError("password", { message: "La contraseña es obligatoria" });
      return;
    }

    const correoNormalizado = values.correo.trim().toLowerCase();
    const yaExiste = usuarios.some(
      (u) => u.id !== editTarget?.id && u.correo.trim().toLowerCase() === correoNormalizado
    );
    if (yaExiste) {
      form.setError("correo", { message: `Ya existe una cuenta con el correo "${values.correo.trim()}".` });
      return;
    }

    await ejecutarGuardado(
      async () => {
        if (editTarget) {
          const { password, ...resto } = values;
          await editarUsuario(editTarget.id, password ? { ...resto, password } : resto);
          toast.success(`"${values.nombre}" fue actualizado.`);
        } else {
          await crearUsuario(values as FormValues & { password: string });
          toast.success(`"${values.nombre}" fue creado correctamente.`);
        }
        setDialogOpen(false);
      },
      {
        etiqueta: editTarget ? "Guardando usuario" : "Creando usuario",
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el usuario."),
      }
    );
  }

  async function toggleEstado(usuario: Usuario) {
    try {
      if (usuario.estado === "activo") {
        await desactivarUsuario(usuario.id);
        toast.success(`"${usuario.nombre}" fue desactivado.`);
      } else {
        await activarUsuario(usuario.id);
        toast.success(`"${usuario.nombre}" fue activado.`);
      }
    } catch {
      toast.error("No se pudo actualizar el estado del usuario.");
    }
  }

  // Esqueleto neutro mientras rehidrata el store persistido de usuarios.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={5} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Gestión de Usuarios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Administra las cuentas y roles de la plataforma.
          </p>
        </div>
        {puedeCrear && (
          <Button
            onClick={abrirCrear}
            className="h-9 px-4 text-sm font-medium border-0 shrink-0 justify-center w-full sm:w-auto"
            style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
          >
            <Plus className="w-4 h-4" />
            Crear usuario
          </Button>
        )}
      </div>

      {/* Búsqueda + filtros por rol */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
            style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-lg p-1 shrink-0 overflow-x-auto"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
        >
          {FILTROS_ROL.map(({ value, label }) => {
            const isActive = filtroRol === value;
            return (
              <button
                key={value}
                onClick={() => setFiltroRol(value)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0"
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
      </div>

      {/* Lista */}
      {usuariosFiltrados.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
        >
          <Users className="w-9 h-9 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>
            {busqueda || filtroRol !== TODOS_LOS_ROLES ? "Sin resultados" : "Aún no hay usuarios"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            {busqueda || filtroRol !== TODOS_LOS_ROLES ? "Prueba con otros términos o filtros." : "Crea el primer usuario para comenzar."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {usuariosPagina.map((u) => {
            const rolConfig = ROL_CONFIG[u.rol];
            const estadoConfig = ESTADO_CONFIG[u.estado];
            const roles = u.roles?.length ? u.roles : [u.rol];
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
              >
                {/* Usuario */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {u.avatarUrl ? (
                    <Image
                      src={u.avatarUrl}
                      alt={u.nombre}
                      width={36}
                      height={36}
                      unoptimized
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ backgroundColor: `${rolConfig.color}22`, color: rolConfig.color }}
                    >
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>{u.nombre}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{u.correo}</p>
                  </div>
                </div>

                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {roles.map((rol) => (
                    <span
                      key={rol}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ color: ROL_CONFIG[rol].color, backgroundColor: `${ROL_CONFIG[rol].color}1F` }}
                    >
                      {ROL_CONFIG[rol].label}
                    </span>
                  ))}
                </div>

                {/* Estado */}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0 w-20" style={{ color: estadoConfig.color }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: estadoConfig.color }} />
                  {estadoConfig.label}
                </span>

                {/* Acciones — solo si el privilegio real lo permite, no solo el rol */}
                {puedeEditar && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          style={{ color: "var(--text-dim)" }}
                          aria-label="Acciones de usuario"
                        />
                      }
                    >
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => abrirEditar(u)}>
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant={u.estado === "activo" ? "destructive" : "default"}
                        onClick={() => toggleEstado(u)}
                      >
                        {u.estado === "activo" ? (
                          <><Ban className="w-3.5 h-3.5" /> Desactivar</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Activar</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={pageSize}
        itemLabel={totalItems === 1 ? "usuario" : "usuarios"}
      />

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar usuario" : "Crear usuario"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Actualiza los datos del usuario." : "Registra un nuevo usuario en la plataforma."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }: { field: ControllerRenderProps<FormValues, "nombre"> }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez" style={inputStyle} maxLength={MAX_NOMBRE} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="correo"
                render={({ field }: { field: ControllerRenderProps<FormValues, "correo"> }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ej. juan@gmail.com" style={inputStyle} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: ControllerRenderProps<FormValues, "password"> }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={editTarget ? "Dejar en blanco para no cambiarla" : "Mínimo 8 caracteres"}
                          className="pr-11"
                          style={inputStyle}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: "var(--text-dim)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Roles</FormLabel>
                <p className="text-xs -mt-1 mb-1" style={{ color: "var(--text-dim)" }}>
                  Puede tener más de uno — con varios, ve las secciones de cada uno a la vez en su dashboard.
                </p>
                <Controller
                  control={form.control}
                  name="roles"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(ROL_CONFIG) as [Role, { label: string; color: string }][]).map(
                        ([value, { label, color }]) => {
                          const activo = field.value?.includes(value);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  activo
                                    ? field.value.filter((r) => r !== value)
                                    : [...(field.value ?? []), value]
                                )
                              }
                              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
                              style={{
                                color: activo ? color : "var(--text-dim)",
                                backgroundColor: activo ? `${color}1F` : "var(--hover-surface)",
                                borderColor: activo ? `${color}55` : "var(--border-hair)",
                              }}
                            >
                              {label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                />
                {form.formState.errors.roles && (
                  <p className="text-xs text-destructive">{form.formState.errors.roles.message}</p>
                )}
              </FormItem>



              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={guardando}
                  loadingText={editTarget ? "Guardando…" : "Creando…"}
                  className="border-0"
                  style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                >
                  {editTarget ? "Guardar cambios" : "Crear usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
