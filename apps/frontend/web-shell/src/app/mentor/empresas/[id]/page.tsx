import { EmpresaDetailView } from "@leanstart/empresas-front";

export default function Page() {
  return (
    <EmpresaDetailView
      basePath="/mentor/empresas"
      readOnly
      backLabel="Empresas"
    />
  );
}
