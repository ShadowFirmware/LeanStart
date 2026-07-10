import { auth } from "@/auth";
import { MentorHistorialView } from "@leanstart/mentor-front";

export default async function Page() {
  const session = await auth();
  const autorNombre = session?.user?.name ?? "Mentor Demo";

  return <MentorHistorialView autorNombre={autorNombre} />;
}
