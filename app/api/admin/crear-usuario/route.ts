import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: requester, error: authError } = await admin.auth.getUser(token);
  if (authError || !requester?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { email, password, nombre } = await req.json();
  if (!email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Email y contraseña (mínimo 6 caracteres) son obligatorios" }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { nombre: nombre || "" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.user?.id });
}
