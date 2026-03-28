import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== "360foot-cron-secret-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Search for continental & international cups
  const searches = [
    "AFC", "CONCACAF", "Copa", "Euro", "Asian", "Gold Cup",
    "Libertadores", "Sudamericana", "Nations League",
  ];

  const results = [];
  for (const term of searches) {
    const res = await fetch(
      `https://v3.football.api-sports.io/leagues?search=${encodeURIComponent(term)}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
    );
    const data = await res.json();
    for (const item of data.response || []) {
      const lg = item.league;
      const c = item.country;
      // Only cups and international competitions
      if (lg.type === "Cup" || lg.type === "League") {
        results.push({
          id: lg.id,
          name: lg.name,
          type: lg.type,
          country: c?.name || "?",
        });
      }
    }
    await new Promise((r) => setTimeout(r, 7000));
  }

  // Deduplicate by id
  const seen = new Set();
  const unique = results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Sort by country then name
  unique.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  return NextResponse.json({ count: unique.length, results: unique });
}
