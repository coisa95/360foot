import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookmakers")
      .select("slug,name,affiliate_url")
      .eq("active", true);

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    // Also test single query like the go page does
    const { data: single, error: singleError } = await supabase
      .from("bookmakers")
      .select("id,name,slug,bonus,bonus_json,affiliate_url")
      .eq("slug", "1xbet")
      .single();

    return NextResponse.json({
      all: data,
      single,
      singleError: singleError ? { message: singleError.message, code: singleError.code } : null,
      envCheck: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
