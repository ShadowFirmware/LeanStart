import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CombinedSidebar } from "@/components/shared/combined-sidebar";
import { AlexaWidget } from "@/components/emprendedor/alexa-widget";

const DEV_USER = { name: "Emprendedor Demo", email: "demo@leanstart.dev" };

export default async function EmprendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    if (!session?.user || !session.user.roles?.includes("emprendedor")) {
      redirect("/login");
    }
  }

  const userName = session?.user?.name ?? DEV_USER.name;
  const userEmail = session?.user?.email ?? DEV_USER.email;
  const roles = session?.user?.roles?.length ? session.user.roles : ["emprendedor" as const];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--shell)" }}>
      <CombinedSidebar roles={roles} userName={userName} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
      <AlexaWidget />
    </div>
  );
}
