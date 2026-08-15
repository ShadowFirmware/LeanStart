"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, Rocket, GraduationCap, ClipboardCheck, Pencil, Check, Plus, Trash2, UserCog,
  Users, Building2, Package, LayoutTemplate, Lightbulb, BarChart3, Search, X,
} from "lucide-react";
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Input, Textarea, useHasHydrated, ViewSkeleton, LoadingOverlay, Spinner, useAccion,
} from "@leanstart/commons";
import type { Role, Modulo, Accion, Usuario } from "@leanstart/commons";
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

type MatrizRolLocal = Record<Modulo, Accion[]>;

/** El rol "dueño" de cada módulo: el que por defecto tiene más acciones ahí
 *  (ver PRIVILEGIOS_DEFAULT en el store). Si a un usuario se le otorgan en la
 *  matriz privilegios de un módulo que superan lo que sus roles actuales ya le
 *  dan ahí, se le añade automáticamente el rol dueño — su dashboard se combina
 *  solo, con el mecanismo de multi-rol que ya existe. */
const MODULO_ROL_DUENO: Record<Modulo, Role> = {
  usuarios: "administrador",
  empresas: "emprendedor",
  productos: "emprendedor",
  lean_canvas: "emprendedor",
  hipotesis: "emprendedor",
  mentorias: "mentor",
  evaluaciones: "evaluador",
  reportes: "administrador",
};

export function RolesPrivilegiosView() {
  const hydrated = useHasHydrated();
  const [seccion, setSeccion] = useState<Seccion>("roles");
  const descripciones = useRolesStore((s) => s.descripciones);
  const actualizarDescripcion = useRolesStore((s) => s.actualizarDescripcion);
  const personalizados = useRolesStore((s) => s.personalizados);
  const agregarRol = useRolesStore((s) => s.agregarRol);
  const editarRolPersonalizado = useRolesStore((s) => s.editarRolPersonalizado);
  const eliminarRolPersonalizado = useRolesStore((s) => s.eliminarRolPersonalizado);
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const editarUsuario = useUsuariosStore((s) => s.editarUsuario);

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

  const privilegiosUsuario = usePrivilegiosStore((s) => s.privilegiosUsuario);
  const cargarPrivilegiosUsuario = usePrivilegiosStore((s) => s.cargarPrivilegiosUsuario);
  const inicializarPrivilegiosUsuario = usePrivilegiosStore((s) => s.inicializarPrivilegiosUsuario);
  const setCeldasUsuario = usePrivilegiosStore((s) => s.setCeldasUsuario);

  // Cargar los privilegios del rol (o del usuario) seleccionado es una ida y
  // vuelta al backend: mientras tanto la matriz muestra su propio velo de
  // carga en lugar de una cuadrícula vacía que parece "sin permisos".
  const [cargandoPrivilegios, setCargandoPrivilegios] = useState(false);
  const [cargandoPrivilegiosUsuario, setCargandoPrivilegiosUsuario] = useState(false);

  /* ─── Escrituras sobre la matriz ───
     Cada endpoint de privilegios responde con la matriz COMPLETA del rol, así
     que dos cambios en vuelo a la vez se pisan: el que responde último borra al
     otro. Por eso la matriz entera se bloquea mientras hay una escritura y el
     spinner se pinta solo en el control que la disparó. `privilegioEnCurso`
     guarda la clave de ese control ("cel:usuarios:ver", "mod:empresas"…). */
  const cambioPrivilegio = useAccion();
  const [privilegioEnCurso, setPrivilegioEnCurso] = useState<string | null>(null);

  // Pestaña "Privilegios" → buscar a alguien puntual: tanto los roles como las
  // celdas de la matriz que se le marquen quedan en un borrador LOCAL (nada se
  // aplica al toque) hasta que se presiona "Guardar cambios" — igual que ya
  // funcionaba para los roles, la matriz ahora se comporta exactamente igual.
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [rolesDraft, setRolesDraft] = useState<Role[]>([]);
  const [privilegiosDraft, setPrivilegiosDraft] = useState<MatrizRolLocal | null>(null);
  const guardadoUsuario = useAccion();
  const matrizBloqueada = cambioPrivilegio.cargando || cargandoPrivilegios || cargandoPrivilegiosUsuario || guardadoUsuario.cargando;

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busquedaUsuario.trim().toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
  });

  function seleccionarUsuario(usuario: Usuario | null) {
    setUsuarioSeleccionado(usuario);
    setRolesDraft(usuario?.roles ?? []);
    setPrivilegiosDraft(null);
    if (!usuario) return;

    if (modoDemo()) {
      // Sin backend: se siembra la matriz del usuario con la unión de sus
      // roles actuales (solo si todavía no tiene una en esta sesión, para no
      // pisar ediciones ya guardadas antes).
      const base = MODULOS.reduce((acc, modulo) => {
        const acciones = new Set<Accion>();
        usuario.roles.forEach((rol) => (privilegios[rol]?.[modulo] ?? []).forEach((a) => acciones.add(a)));
        return { ...acc, [modulo]: [...acciones] };
      }, {} as MatrizRolLocal);
      inicializarPrivilegiosUsuario(usuario.id, base);
      setPrivilegiosDraft((usePrivilegiosStore.getState().privilegiosUsuario[usuario.id] as MatrizRolLocal) ?? base);
      return;
    }

    setCargandoPrivilegiosUsuario(true);
    cargarPrivilegiosUsuario(usuario.id)
      .then(() => {
        const cargados = usePrivilegiosStore.getState().privilegiosUsuario[usuario.id] as MatrizRolLocal | undefined;
        setPrivilegiosDraft(cargados ?? null);
      })
      .catch(() => toast.error("No se pudieron cargar los privilegios de este usuario."))
      .finally(() => setCargandoPrivilegiosUsuario(false));
  }

  // Ediciones LOCALES del borrador de la matriz (sin llamar al backend): las
  // mismas tres formas de alternar que la matriz por rol ya tenía, pero puras.
  function alternarAccionDraft(modulo: Modulo, accion: Accion) {
    setPrivilegiosDraft((actual) => {
      if (!actual) return actual;
      const lista = actual[modulo] ?? [];
      const actualizada = lista.includes(accion) ? lista.filter((a) => a !== accion) : [...lista, accion];
      return { ...actual, [modulo]: actualizada };
    });
  }
  function alternarModuloDraft(modulo: Modulo) {
    setPrivilegiosDraft((actual) => {
      if (!actual) return actual;
      const lista = actual[modulo] ?? [];
      return { ...actual, [modulo]: lista.length === ACCIONES.length ? [] : [...ACCIONES] };
    });
  }
  function alternarColumnaDraft(accion: Accion) {
    setPrivilegiosDraft((actual) => {
      if (!actual) return actual;
      const todosLaTienen = MODULOS.every((m) => (actual[m] ?? []).includes(accion));
      const nueva = {} as MatrizRolLocal;
      for (const m of MODULOS) {
        const lista = actual[m] ?? [];
        nueva[m] = todosLaTienen ? lista.filter((a) => a !== accion) : lista.includes(accion) ? lista : [...lista, accion];
      }
      return nueva;
    });
  }
  function alternarTodosDraft(activar: boolean) {
    setPrivilegiosDraft(() => MODULOS.reduce((acc, m) => ({ ...acc, [m]: activar ? [...ACCIONES] : [] }), {} as MatrizRolLocal));
  }

  function toggleRolDraft(rol: Role) {
    setRolesDraft((actual) => {
      if (actual.includes(rol)) {
        if (actual.length === 1) {
          toast.error("Un usuario necesita al menos un rol.");
          return actual;
        }
        return actual.filter((r) => r !== rol);
      }
      return [...actual, rol];
    });
  }

  /** Celdas donde el borrador difiere de lo último cargado del backend — lo
   *  que realmente hay que guardar si se presiona "Guardar cambios". */
  const privilegiosOriginales = usuarioSeleccionado ? (privilegiosUsuario[usuarioSeleccionado.id] as MatrizRolLocal | undefined) : undefined;
  const cambiosPrivilegiosPendientes: Array<{ modulo: Modulo; accion: Accion; activar: boolean }> =
    usuarioSeleccionado && privilegiosDraft && privilegiosOriginales
      ? MODULOS.flatMap((modulo) => {
          const orig = new Set(privilegiosOriginales[modulo] ?? []);
          const draft = new Set(privilegiosDraft[modulo] ?? []);
          return ACCIONES.filter((accion) => orig.has(accion) !== draft.has(accion)).map((accion) => ({
            modulo,
            accion,
            activar: draft.has(accion),
          }));
        })
      : [];

  /** Roles que el borrador de privilegios IMPLICA aunque no se hayan marcado
   *  a mano: si para un módulo el borrador da más de lo que los roles ya
   *  marcados (`rolesDraft`) darían por defecto, se entiende que el usuario
   *  necesita el rol dueño de ese módulo — y con eso su dashboard se combina
   *  solo (mismo mecanismo que dar el rol desde los chips de arriba). */
  const rolesAutoImplicados: Role[] = privilegiosDraft
    ? [
        ...new Set(
          MODULOS.filter((modulo) => {
            const base = new Set<Accion>();
            rolesDraft.forEach((rol) => (privilegios[rol]?.[modulo] ?? []).forEach((a) => base.add(a)));
            return (privilegiosDraft[modulo] ?? []).some((a) => !base.has(a));
          }).map((modulo) => MODULO_ROL_DUENO[modulo])
        ),
      ].filter((rol) => !rolesDraft.includes(rol))
    : [];

  const rolesEfectivosDraft: Role[] = [...new Set([...rolesDraft, ...rolesAutoImplicados])];

  const hayCambiosRoles =
    usuarioSeleccionado !== null &&
    (rolesEfectivosDraft.length !== usuarioSeleccionado.roles.length ||
      rolesEfectivosDraft.some((r) => !usuarioSeleccionado.roles.includes(r)));

  const hayCambiosUsuario = hayCambiosRoles || cambiosPrivilegiosPendientes.length > 0;

  // Con un usuario seleccionado, la matriz grande edita el BORRADOR de sus
  // privilegios efectivos (nada se guarda hasta "Guardar cambios"); sin
  // selección, funciona como siempre: editable por rol al instante.
  const matrizMostrada: MatrizRolLocal = usuarioSeleccionado
    ? (privilegiosDraft ?? ({} as MatrizRolLocal))
    : ((privilegios[rolPrivilegios] ?? {}) as MatrizRolLocal);

  async function guardarCambiosUsuario() {
    if (!usuarioSeleccionado) return;
    await guardadoUsuario.ejecutar(
      async () => {
        if (hayCambiosRoles) {
          await editarUsuario(usuarioSeleccionado.id, {
            nombre: usuarioSeleccionado.nombre,
            correo: usuarioSeleccionado.correo,
            roles: rolesEfectivosDraft,
          });
          setUsuarioSeleccionado((actual) =>
            actual ? { ...actual, roles: rolesEfectivosDraft, rol: rolesEfectivosDraft[0] } : actual
          );
          setRolesDraft(rolesEfectivosDraft);
        }
        if (cambiosPrivilegiosPendientes.length > 0) {
          await setCeldasUsuario(usuarioSeleccionado.id, cambiosPrivilegiosPendientes);
        }
        const mensajeRoles =
          rolesAutoImplicados.length > 0
            ? ` Se le añadió el rol de ${rolesAutoImplicados.map((r) => ROLES_CONFIG[r].label).join(" y ")} por los privilegios otorgados.`
            : "";
        toast.success(`Roles y privilegios de "${usuarioSeleccionado.nombre}" actualizados.${mensajeRoles}`);
      },
      {
        etiqueta: "Guardando roles y privilegios",
        onError: () => toast.error("No se pudo guardar. Intenta de nuevo."),
      }
    );
  }

  function cancelarCambiosUsuario() {
    if (!usuarioSeleccionado) return;
    setRolesDraft(usuarioSeleccionado.roles);
    setPrivilegiosDraft((privilegiosUsuario[usuarioSeleccionado.id] as MatrizRolLocal | undefined) ?? null);
  }

  async function aplicarPrivilegio(clave: string, operacion: () => Promise<void>) {
    await cambioPrivilegio.ejecutar(
      // Marcar dentro de la operación y no antes: si `ejecutar` descarta esta
      // llamada por reentrada, el spinner del cambio que sí está corriendo no
      // se mueve de sitio.
      async () => {
        setPrivilegioEnCurso(clave);
        try {
          await operacion();
        } finally {
          setPrivilegioEnCurso(null);
        }
      },
      {
        etiqueta: "Actualizando privilegios",
        onError: () => toast.error("No se pudo actualizar los privilegios."),
      }
    );
  }

  useEffect(() => {
    if (modoDemo()) return;
    setCargandoPrivilegios(true);
    cargarPrivilegios(rolPrivilegios)
      .catch(() => toast.error("No se pudieron cargar los privilegios."))
      .finally(() => setCargandoPrivilegios(false));
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

  // Roles personalizados, descripciones y matriz de privilegios viven en stores
  // persistidos: hasta que rehidraten se muestra el esqueleto.
  if (!hydrated) return <ViewSkeleton variante="lista" ancho="max-w-5xl" filas={4} />;

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

      {seccion === "roles" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES_ORDEN.map((rol) => {
            const cfg = ROLES_CONFIG[rol];
            const Icon = cfg.icon;
            const count = usuarios.filter((u) => u.roles.includes(rol)).length;
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
      )}

      {seccion === "privilegios" && (
        <div className="flex flex-col gap-4">
          {/* Buscar un usuario puntual y darle/quitarle roles solo a él (afecta sus
              privilegios efectivos, unión de todos sus roles), sin tocar a nadie más
              — a diferencia de la matriz de abajo, que aplica al rol completo. */}
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Privilegios de un usuario específico</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                Busca a alguien para ver a quién le estás dando o quitando privilegios, y cámbiale solo sus roles a él.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
              />
            </div>

            {busquedaUsuario.trim() && (
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {usuariosFiltrados.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "var(--text-dim)" }}>Sin resultados.</p>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const isActive = usuarioSeleccionado?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => seleccionarUsuario(isActive ? null : u)}
                        className="rounded-lg p-3 flex items-center gap-3 text-left transition-colors"
                        style={{
                          border: `1px solid ${isActive ? "rgba(154,98,250,0.4)" : "var(--border-hair)"}`,
                          backgroundColor: isActive ? "rgba(154,98,250,0.08)" : "transparent",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
                        >
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>{u.nombre}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{u.correo}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end shrink-0">
                          {u.roles.map((rol) => (
                            <span
                              key={rol}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ color: ROLES_CONFIG[rol].color, backgroundColor: `${ROLES_CONFIG[rol].color}1F` }}
                            >
                              {ROLES_CONFIG[rol].label}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {usuarioSeleccionado && (
              <div className="rounded-lg p-4 flex flex-col gap-4" style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ backgroundColor: "var(--brand-tint)", color: "var(--brand)" }}
                  >
                    {usuarioSeleccionado.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>{usuarioSeleccionado.nombre}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{usuarioSeleccionado.correo}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => seleccionarUsuario(null)}
                    style={{ color: "var(--text-dim)" }}
                    aria-label="Dejar de mostrar este usuario en la matriz"
                    title="Volver a la matriz por rol"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLES_ORDEN.map((rol) => {
                      const cfg = ROLES_CONFIG[rol];
                      const marcado = rolesDraft.includes(rol);
                      const soloImplicado = !marcado && rolesAutoImplicados.includes(rol);
                      const activo = marcado || soloImplicado;
                      return (
                        <button
                          key={rol}
                          type="button"
                          disabled={guardadoUsuario.cargando}
                          onClick={() => toggleRolDraft(rol)}
                          title={soloImplicado ? `Implicado por los privilegios que le diste en ${MODULO_CONFIG[MODULOS.find((m) => MODULO_ROL_DUENO[m] === rol) ?? "usuarios"].label}` : undefined}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            color: activo ? cfg.color : "var(--text-dim)",
                            backgroundColor: activo ? `${cfg.color}1F` : "var(--surface-profile)",
                            borderColor: activo ? `${cfg.color}55` : "var(--border-hair)",
                            borderStyle: soloImplicado ? "dashed" : "solid",
                          }}
                        >
                          {activo ? <Check className="w-3 h-3" /> : null}
                          {cfg.label}
                          {soloImplicado && <span className="opacity-70">(auto)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hayCambiosUsuario && (
                  <p className="text-xs" style={{ color: "var(--brand)" }}>
                    Cambios sin guardar — la matriz de abajo ya muestra el borrador.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hayCambiosUsuario || guardadoUsuario.cargando}
                    onClick={cancelarCambiosUsuario}
                    className="h-8 px-3 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={!hayCambiosUsuario}
                    loading={guardadoUsuario.cargando}
                    loadingText="Guardando…"
                    onClick={guardarCambiosUsuario}
                    className="h-8 px-3 text-xs border-0"
                    style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)" }}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selector de rol con ícono + conteo de usuarios — reemplazado por un aviso
              mientras se está mostrando (en solo lectura) la matriz de un usuario. */}
          {usuarioSeleccionado ? (
            <div
              className="flex items-center gap-2 rounded-xl px-4 h-10 text-sm w-fit"
              style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.25)", color: "var(--brand-accent)" }}
            >
              <Users className="w-4 h-4" />
              Editando los privilegios de <strong>{usuarioSeleccionado.nombre}</strong> — se aplican solo a él
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {ROLES_ORDEN.map((rol) => {
                const cfg = ROLES_CONFIG[rol];
                const RolIcon = cfg.icon;
                const isActive = rolPrivilegios === rol;
                const count = usuarios.filter((u) => u.roles.includes(rol)).length;
                return (
                  <button
                    key={rol}
                    type="button"
                    onClick={() => setRolPrivilegios(rol)}
                    // Cambiar de rol a mitad de una escritura movería el spinner a la
                    // celda equivalente del rol nuevo, que no es la que se está guardando.
                    disabled={cambioPrivilegio.cargando}
                    className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
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
                    type="button"
                    onClick={() => setRolPrivilegios(rol.id)}
                    disabled={cambioPrivilegio.cargando}
                    className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
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
          )}

          {/* Resumen de permisos + acciones rápidas (los botones de otorgar/quitar
              todo no aplican mientras se muestra un usuario en solo lectura). */}
          {(() => {
            const total = MODULOS.length * ACCIONES.length;
            const otorgados = MODULOS.reduce((acc, m) => acc + (matrizMostrada[m as Modulo]?.length ?? 0), 0);
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => usuarioSeleccionado ? alternarTodosDraft(true) : aplicarPrivilegio("todos:otorgar", () => setTodos(rolPrivilegios, true))}
                    loading={privilegioEnCurso === "todos:otorgar"}
                    loadingText="Otorgando…"
                    disabled={matrizBloqueada}
                    className="text-xs font-medium px-3 h-8 rounded-lg"
                    style={{ color: "var(--brand-accent)", backgroundColor: "var(--brand-tint)", border: "1px solid rgba(154,98,250,0.25)" }}
                  >
                    Otorgar todo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => usuarioSeleccionado ? alternarTodosDraft(false) : aplicarPrivilegio("todos:quitar", () => setTodos(rolPrivilegios, false))}
                    loading={privilegioEnCurso === "todos:quitar"}
                    loadingText="Quitando…"
                    disabled={matrizBloqueada}
                    className="text-xs font-medium px-3 h-8 rounded-lg"
                    style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
                  >
                    Quitar todo
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Matriz interactiva módulo × acción */}
          <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}>
            <LoadingOverlay show={usuarioSeleccionado ? cargandoPrivilegiosUsuario : cargandoPrivilegios} message="Cargando privilegios" />
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
                    const enTodos = MODULOS.every((m) => (matrizMostrada[m] ?? []).includes(accion));
                    const enAlgunos = MODULOS.some((m) => (matrizMostrada[m] ?? []).includes(accion));
                    return (
                      <button
                        key={accion}
                        type="button"
                        onClick={() => usuarioSeleccionado ? alternarColumnaDraft(accion) : aplicarPrivilegio(`col:${accion}`, () => toggleAccionColumna(rolPrivilegios, accion))}
                        disabled={matrizBloqueada}
                        aria-busy={privilegioEnCurso === `col:${accion}` || undefined}
                        className="flex flex-col items-center justify-center gap-0.5 px-1 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        title={enTodos ? `Quitar "${ACCION_LABELS[accion]}" de todos los módulos` : `Dar "${ACCION_LABELS[accion]}" a todos los módulos`}
                        style={{ color: enAlgunos ? "var(--brand-accent)" : "var(--text-dim)", backgroundColor: enTodos ? "rgba(154,98,250,0.08)" : "transparent" }}
                      >
                        <span className="text-[11px] font-semibold">{ACCION_LABELS[accion]}</span>
                        {privilegioEnCurso === `col:${accion}` ? (
                          <Spinner size={12} />
                        ) : (
                          <span
                            className="text-[9px] px-1 rounded-full"
                            style={{ color: "var(--text-dim)", backgroundColor: "var(--border-subtle)" }}
                          >
                            {MODULOS.filter((m) => (matrizMostrada[m] ?? []).includes(accion)).length}/{MODULOS.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Filas de módulos */}
                {MODULOS.map((modulo, i) => {
                  const modCfg = MODULO_CONFIG[modulo];
                  const ModIcon = modCfg.icon;
                  const activas = matrizMostrada[modulo] ?? [];
                  const todoActivo = activas.length === ACCIONES.length;
                  return (
                    <div
                      key={modulo}
                      className="grid items-stretch"
                      style={{ gridTemplateColumns: GRID_COLS, borderTop: i === 0 ? "none" : "1px solid var(--hover-surface)" }}
                    >
                      <button
                        type="button"
                        onClick={() => usuarioSeleccionado ? alternarModuloDraft(modulo) : aplicarPrivilegio(`mod:${modulo}`, () => toggleModuloCompleto(rolPrivilegios, modulo))}
                        disabled={matrizBloqueada}
                        aria-busy={privilegioEnCurso === `mod:${modulo}` || undefined}
                        className="sticky left-0 z-10 flex items-center gap-2.5 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: "var(--surface-profile)" }}
                        title={todoActivo ? "Quitar todos los permisos del módulo" : "Otorgar todos los permisos del módulo"}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: todoActivo ? "rgba(154,98,250,0.18)" : "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.16)" }}
                        >
                          {privilegioEnCurso === `mod:${modulo}` ? (
                            <Spinner size={16} />
                          ) : (
                            <ModIcon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                          )}
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
                        const clave = `cel:${modulo}:${accion}`;
                        const enCurso = privilegioEnCurso === clave;
                        return (
                          <button
                            key={accion}
                            type="button"
                            onClick={() => usuarioSeleccionado ? alternarAccionDraft(modulo, accion) : aplicarPrivilegio(clave, () => toggleAccion(rolPrivilegios, modulo, accion))}
                            disabled={matrizBloqueada}
                            aria-busy={enCurso || undefined}
                            className="flex items-center justify-center py-3 group disabled:cursor-not-allowed disabled:opacity-60"
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
                              {enCurso ? (
                                <Spinner size={14} />
                              ) : activa ? (
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
