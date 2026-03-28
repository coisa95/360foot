import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== "360foot-cron-secret-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const id of [378, 968]) {
    const res = await fetch(
      `https://v3.football.api-sports.io/leagues?id=${id}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
    );
    const data = await res.json();
    const seasons = data.response?.[0]?.seasons || [];
    const current = seasons.find((s: { current: boolean }) => s.current);
    const last3 = seasons.slice(-3);
    results.push({ id, name: data.response?.[0]?.league?.name, currentSeason: current, recentSeasons: last3 });
    await new Promise((r) => setTimeout(r, 7000));
  }

  return NextResponse.json({ results });
}
