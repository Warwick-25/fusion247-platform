'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function Stage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading…</p>;

  if (!session) {
    return (
      <main className="p-8 space-y-4">
        <h2 className="text-xl font-semibold">Trainr</h2>
        <button onClick={() => signIn('github')}>Sign in with GitHub</button>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-4">
      <h2 className="text-xl font-semibold">TrAInr live</h2>
      <p>Welcome, {session.user?.name}. Avatar & Realtime hooks ready.</p> {/* ✅ user, not user2 */}
      <button onClick={() => signOut()}>Sign out</button>
    </main>
  );
}

