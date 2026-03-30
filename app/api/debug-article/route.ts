import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "rdc-jamaique-desabre-face-au-defi-des-barrages-mondiaux";

  try {
    const supabase = createClient();

    // Exact same query as article page
    const { data: article, error } = await supabase
      .from("articles")
      .select("id,title,slug,content,excerpt,type,tags,published_at,updated_at,og_image_url,image,seo_title,seo_description,league_id,match_id")
      .eq("slug", slug)
      .single();

    // Exact same queries as article page
    const results = await Promise.all([
      supabase.from("articles").select("id,title,slug,excerpt,type,published_at,og_image_url").neq("id", article?.id || "").not("published_at", "is", null).order("published_at", { ascending: false }).limit(5),
      supabase.from("teams").select("name, slug").order("name").limit(500),
      supabase.from("players").select("name, slug").order("name").limit(1000),
      supabase.from("leagues").select("name, slug").order("name").limit(500),
    ]);

    // Try sanitize-html like article page
    let sanitizeOk = false;
    let sanitizeError = "";
    try {
      const sanitizeHtml = (await import("sanitize-html")).default;
      const testContent = article?.content || "<p>test</p>";
      sanitizeHtml(testContent, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
      });
      sanitizeOk = true;
    } catch (e) {
      sanitizeError = String(e);
    }

    return NextResponse.json({
      searched_slug: slug,
      article_found: !!article,
      article_title: article?.title || null,
      article_content_length: article?.content?.length || 0,
      error: error ? { message: error.message, code: error.code, details: error.details } : null,
      related_count: results[0].data?.length || 0,
      teams_count: results[1].data?.length || 0,
      players_count: results[2].data?.length || 0,
      leagues_count: results[3].data?.length || 0,
      sanitize_ok: sanitizeOk,
      sanitize_error: sanitizeError,
      env_check: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: (err as Error).stack }, { status: 500 });
  }
}
