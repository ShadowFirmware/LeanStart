import { auth } from "@/auth";
import { CanvasView } from "@leanstart/empresas-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return (
    <CanvasView
      basePath="/mentor/empresas"
      readOnly
      permitirComentarios
      autorNombre={autorNombre}
    />
  );
}
