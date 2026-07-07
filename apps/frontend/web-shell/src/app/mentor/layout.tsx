import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MentorSidebar } from "@/components/mentor/sidebar";

const DEV_USER = { name: "Mentor Demo", email: "mentor@leanstart.dev" };

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (process.env.NODE_ENV !== "development") {
    if (!session?.user || session.user.rol !== "mentor") {
      redirect("/login");
    }
  }

  const userName = session?.user?.name ?? DEV_USER.name;
  const userEmail = session?.user?.email ?? DEV_USER.email;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0D0C10" }}>
      <MentorSidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
