import { auth } from "@/auth";
import { HipotesisEditView } from "@leanstart/empresas-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return (
    <HipotesisEditView
      basePath="/mentor/empresas"
      readOnly
      permitirComentarios
      autorNombre={autorNombre}
    />
  );
}
