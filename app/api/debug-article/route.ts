import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "rdc-jamaique-desabre-face-au-defi-des-barrages-mondiaux";

  try {
    const supabase = createClient();

    // Test 1: simple query
    const { data: article, error } = await supabase
      .from("articles")
      .select("id,title,slug")
      .eq("slug", slug)
      .single();

    // Test 2: count articles
    const { count } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true });

    // Test 3: list some slugs
    const { data: slugs } = await supabase
      .from("articles")
      .select("slug")
      .order("published_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      searched_slug: slug,
      article: article || null,
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      total_articles: count,
      recent_slugs: slugs?.map(s => s.slug) || [],
      env_check: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...",
      }
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
