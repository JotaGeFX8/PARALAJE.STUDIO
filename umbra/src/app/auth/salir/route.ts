import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Cierre de sesión. Solo POST, para que un enlace externo no pueda forzarlo. */
export async function POST() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return new NextResponse(null, { status: 303, headers: { Location: "/" } });
}
