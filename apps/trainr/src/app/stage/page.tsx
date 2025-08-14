import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Stage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="p-8 space-y-4">
      <h2 className="text-xl font-semibold">TrAIner live</h2>
      <p>Welcome, {session.user?.name}. Avatar & Realtime hooks ready.</p>
    </main>
  );
}
