// UI primitives (shadcn/ui)
export * from "./components/ui/alert-dialog";
export * from "./components/ui/avatar";
export * from "./components/ui/badge";
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/dialog";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/empresa-logo";
export * from "./components/ui/form";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/loader";
export * from "./components/ui/navigation-menu";
export * from "./components/ui/pagination-bar";
export * from "./components/ui/popover";
export * from "./components/ui/progress";
export * from "./components/ui/select";
export * from "./components/ui/separator";
export * from "./components/ui/sheet";
export * from "./components/ui/sidebar";
export * from "./components/ui/skeleton";
export * from "./components/ui/sonner";
export * from "./components/ui/table";
export * from "./components/ui/tabs";
export * from "./components/ui/textarea";
export * from "./components/ui/tooltip";

// Hooks
export { useIsMobile } from "./hooks/use-mobile";
export { usePrivilegios } from "./hooks/use-privilegios";
export { useCurrentUser } from "./hooks/use-current-user";
export { useHasHydrated } from "./hooks/use-has-hydrated";
export { usePagination } from "./hooks/use-pagination";
export { useAccion } from "./hooks/use-accion";

// Modo demo / identidad
export { DEMO_MODE, DEMO_USERS, DEMO_ACCOUNTS } from "./lib/demo";
export type { DemoUser, DemoAccount } from "./lib/demo";

// Store
export { useUsuariosStore } from "./store/usuarios";
export type { Usuario, EstadoUsuario } from "./store/usuarios";
export { useCargaStore, conCarga } from "./store/carga";
export { usePerfilStore } from "./store/perfil";
export type { PerfilData } from "./store/perfil";

// Utils
export { cn } from "./lib/utils";
export { fileToDataUrl } from "./lib/file-to-data-url";
export { compressImageToDataUrl } from "./lib/compress-image";
export type { CompressImageOptions } from "./lib/compress-image";
export { createSafeLocalStorage } from "./lib/safe-storage";
export { apiFetch, modoDemo, cerrarSesionBackend, cerrarSesionUnaVez } from "./lib/api-client";
export { debounce } from "./lib/debounce";
export { GIRO_LABELS, ESTADO_EMPRESA_CONFIG } from "./lib/etiquetas";
export type { EstiloEstado } from "./lib/etiquetas";

// Shared domain types
export type * from "./types";
