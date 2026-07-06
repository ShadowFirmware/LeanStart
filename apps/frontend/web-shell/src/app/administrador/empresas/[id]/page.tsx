import { EmpresaDetailView } from "@leanstart/empresas-front";

export default function Page() {
  return (
    <EmpresaDetailView
      basePath="/administrador/empresas"
      readOnly
      backLabel="Empresas"
    />
  );
}
