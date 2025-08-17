'use client';

import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(''); // UUID only (no "session-" prefix)

  useEffect(() => {
    // mark client mounted to avoid hydration mismatches
    setMounted(true);

    // get or create a session key in localStorage
    let stored = localStorage.getItem('trainr_session_id');
    if (!stored || !stored.startsWith('session-')) {
      stored = `session-${uuidv4()}`;
      localStorage.setItem('trainr_session_id', stored);
    }

    // store UUID part only for DB
    setSessionId(stored.replace('session-', ''));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/openai/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          session_id: sessionId, // UUID only
          source: 'chat-ui',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Unknown error');
      }

      setResponse(data.result);
      setInput('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Fetch error:', message);
      setResponse(`Goatee blew a fuse: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  // avoid rendering SSR markup that depends on localStorage/session until mounted
  if (!mounted) {
    return <main className="max-w-xl p-8 mx-auto" />;
  }

  return (
    <main className="max-w-xl p-8 mx-auto">
      <h1 className="mb-4 text-4xl font-bold">Chat with TrAIner</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Enter your prompt here"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-black rounded disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Response:</h2>
        <p className="whitespace-pre-wrap">{response}</p>
      </div>
    </main>
  );
}
