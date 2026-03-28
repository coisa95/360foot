import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== "360foot-cron-secret-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const country of ["Guinea", "Gabon"]) {
    const res = await fetch(
      `https://v3.football.api-sports.io/leagues?country=${encodeURIComponent(country)}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
    );
    const data = await res.json();
    for (const item of data.response || []) {
      const lg = item.league;
      const c = item.country;
      results.push({ id: lg.id, name: lg.name, type: lg.type, country: c?.name });
    }
    await new Promise((r) => setTimeout(r, 7000));
  }

  return NextResponse.json({ results });
}
