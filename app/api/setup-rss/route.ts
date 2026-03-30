import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyCronAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // Try to create the table using a simple insert/select test
  // If the table doesn't exist, we instruct the user
  const { error } = await supabase
    .from("rss_processed")
    .select("id")
    .limit(1);

  if (error && error.message.includes("rss_processed")) {
    return NextResponse.json({
      success: false,
      message:
        "Table rss_processed does not exist. Please create it in Supabase SQL Editor.",
      sql: `CREATE TABLE rss_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT UNIQUE NOT NULL,
  article_id UUID REFERENCES articles(id),
  processed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_rss_processed_url ON rss_processed(source_url);`,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Table rss_processed exists and is ready.",
  });
}
