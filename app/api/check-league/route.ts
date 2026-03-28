import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== "360foot-cron-secret-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ids = [12, 20, 1000, 17, 19, 36, 233];
  const results = [];

  for (const id of ids) {
    const res = await fetch(
      `https://v3.football.api-sports.io/leagues?id=${id}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
    );
    const data = await res.json();
    const league = data.response?.[0]?.league;
    const country = data.response?.[0]?.country;
    results.push({
      id,
      name: league?.name || "NOT FOUND",
      country: country?.name || "?",
    });
    await new Promise((r) => setTimeout(r, 7000));
  }

  return NextResponse.json({ results });
}
