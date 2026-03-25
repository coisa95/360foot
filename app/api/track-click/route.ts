import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookmaker_name, article_id, page_url } = body;

    if (!bookmaker_name) {
      return NextResponse.json(
        { error: "bookmaker_name is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const country = request.headers.get("x-vercel-ip-country") || "unknown";

    const { error } = await supabase.from("affiliate_clicks").insert({
      bookmaker_name,
      article_id: article_id || null,
      page_url: page_url || null,
      country,
      clicked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error tracking click:", error);
      return NextResponse.json(
        { error: "Failed to track click" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in track-click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
