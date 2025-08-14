'use client';

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

export default function Stage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(); // ✅ Redirects to login screen
    }
  }, [status]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <main className="p-8 space-y-4">
      <h2 className="text-xl font-semibold">TrAIner live</h2>
      <p>Welcome, {session?.user?.name}. Avatar & Realtime hooks ready.</p>
    </main>
  );
}
