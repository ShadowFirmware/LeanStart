import { auth } from "@/auth";
import { EmpresaDetailView } from "@leanstart/empresas-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return (
    <EmpresaDetailView
      basePath="/mentor/empresas"
      readOnly
      backLabel="Empresas"
      permitirComentarios
      autorNombre={autorNombre}
    />
  );
}
