import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    
    if (typeof session_id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    const supabaseClient = supabase();
    const { data, error: selectError } = await supabaseClient
      .from("chat_sessions")
      .select("id")
      .eq("id", session_id)
      .single();

    if (!data && !selectError) {
      const { error: insertError } = await supabaseClient
        .from("chat_sessions")
        .insert([{ id: session_id }]);
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Session creation failed: ${message}` },
      { status: 500 }
    );
  }
}
