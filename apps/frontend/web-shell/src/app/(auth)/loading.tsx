import { LoadingScreen } from "@/components/loading-screen";

/** Las pantallas de autenticación no tienen shell: el preloader ocupa toda la ventana. */
export default function Loading() {
  return <LoadingScreen message="Cargando" />;
}
