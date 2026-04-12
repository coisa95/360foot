import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "360foot2025indexnow";
const HOST = "https://360-foot.com";

export async function POST(req: NextRequest) {
  // Verify a simple bearer token to prevent abuse
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INDEXNOW_SECRET || "360foot-indexnow-2025"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { urls } = await req.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array required" }, { status: 400 });
  }

  // Submit to IndexNow (Bing endpoint, shared with Yandex/others)
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "360-foot.com",
      key: INDEXNOW_KEY,
      keyLocation: `${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls.map((u: string) => u.startsWith("http") ? u : `${HOST}${u}`),
    }),
  });

  return NextResponse.json({
    submitted: urls.length,
    status: response.status,
    ok: response.ok,
  });
}
