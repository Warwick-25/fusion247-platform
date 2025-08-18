// runtime to use node crypto in edge-unfriendly libs if needed
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type BodyShape = {
  prompt?: string;
  session_id?: string; // UUID (no "session-" prefix)
  source?: string;     // optional, not required by schema
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BodyShape;

    const prompt = body?.prompt ?? '';
    const session_id = body?.session_id ?? '';
    const source = body?.source ?? 'trainer-ui';

    if (
      typeof prompt !== 'string' ||
      typeof session_id !== 'string' ||
      prompt.trim() === '' ||
      session_id.trim() === ''
    ) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid prompt/session_id.' },
        { status: 400 }
      );
    }

    const supabaseAdminClient = supabaseAdmin();

    // 1) Ensure a chat_sessions row exists (id is UUID)
    const { error: upsertSessionErr } = await supabaseAdminClient
      .from('chat_sessions')
      .upsert([{ id: session_id }], { onConflict: 'id' });

    if (upsertSessionErr) {
      throw new Error(upsertSessionErr.message);
    }

    // Simple echo response for now
    const assistantText = `You said: "${prompt}" — we heard you!`;

    // 2) Insert user message
    const { error: userMsgErr } = await supabaseAdminClient.from('chat_messages').insert([
      {
        session_id, // FK -> chat_sessions.id
        role: 'user',
        content: prompt,
        // other columns (token_count, tool_calls, metadata, message_order) are optional
      },
    ]);
    if (userMsgErr) throw new Error(userMsgErr.message);

    // 3) Insert assistant message
    const { error: botMsgErr } = await supabaseAdminClient.from('chat_messages').insert([
      {
        session_id,
        role: 'assistant',
        content: assistantText,
      },
    ]);
    if (botMsgErr) throw new Error(botMsgErr.message);

    return NextResponse.json(
      {
        ok: true,
        result: assistantText,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    let message = 'Unknown error';
    try {
      if (err instanceof Error) message = err.message;
      else message = JSON.stringify(err);
    } catch {
      message = 'Unserializable error';
    }
    return NextResponse.json(
      { ok: false, error: `Goatee blew a fuse: ${message}` },
      { status: 500 }
    );
  }
}
