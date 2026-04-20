import { NextRequest, NextResponse } from "next/server";

const HOST = "https://360-foot.com";

export async function POST(req: NextRequest) {
  const secret = process.env.INDEXNOW_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INDEXNOW_SECRET not configured" },
      { status: 500 }
    );
  }

  const indexNowKey = process.env.INDEXNOW_KEY;
  if (!indexNowKey) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY not configured" },
      { status: 500 }
    );
  }

  // Verify a simple bearer token to prevent abuse
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
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
      key: indexNowKey,
      keyLocation: `${HOST}/${indexNowKey}.txt`,
      urlList: urls.map((u: string) => u.startsWith("http") ? u : `${HOST}${u}`),
    }),
  });

  return NextResponse.json({
    submitted: urls.length,
    status: response.status,
    ok: response.ok,
  });
}
