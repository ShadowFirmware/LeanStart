import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EvaluadorSidebar } from "@/components/evaluador/sidebar";

const DEV_USER = { name: "Evaluador Demo", email: "evaluador@leanstart.dev" };

export default async function EvaluadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    if (!session?.user || session.user.rol !== "evaluador") {
      redirect("/login");
    }
  }

  const userName = session?.user?.name ?? DEV_USER.name;
  const userEmail = session?.user?.email ?? DEV_USER.email;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--shell)" }}>
      <EvaluadorSidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
