import { auth } from "@/auth";
import { ProductosListView } from "@leanstart/empresas-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return (
    <ProductosListView
      basePath="/mentor/empresas"
      readOnly
      permitirComentarios
      autorNombre={autorNombre}
    />
  );
}
