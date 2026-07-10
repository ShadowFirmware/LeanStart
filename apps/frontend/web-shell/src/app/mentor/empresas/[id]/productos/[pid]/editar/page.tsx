import { auth } from "@/auth";
import { ProductoEditView } from "@leanstart/empresas-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return (
    <ProductoEditView
      basePath="/mentor/empresas"
      readOnly
      permitirComentarios
      autorNombre={autorNombre}
    />
  );
}
