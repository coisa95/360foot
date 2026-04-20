import { createAnonClient } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  const supabase = createAnonClient();
  const baseUrl = "https://360-foot.com";

  const { data: bookmakers } = await supabase
    .from("bookmakers")
    .select("slug")
    .eq("active", true);

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "hourly" },
    { url: "/actu", priority: "0.9", changefreq: "hourly" },
    { url: "/matchs", priority: "0.9", changefreq: "hourly" },
    { url: "/pronostic", priority: "0.9", changefreq: "hourly" },
    { url: "/competitions", priority: "0.8", changefreq: "daily" },
    { url: "/equipe", priority: "0.8", changefreq: "daily" },
    { url: "/joueur", priority: "0.8", changefreq: "daily" },
    { url: "/transferts", priority: "0.8", changefreq: "daily" },
    { url: "/bons-plans", priority: "0.7", changefreq: "weekly" },
    { url: "/methodologie", priority: "0.3", changefreq: "monthly" },
    { url: "/confidentialite", priority: "0.2", changefreq: "monthly" },
    { url: "/mentions-legales", priority: "0.2", changefreq: "monthly" },
    { url: "/bookmakers", priority: "0.7", changefreq: "weekly" },
    { url: "/selection", priority: "0.7", changefreq: "weekly" },
  ];

  const nationalTeams = ["CI", "SN", "CM", "ML", "BF"];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  if (bookmakers) {
    for (const bk of bookmakers) {
      xml += `
  <url>
    <loc>${baseUrl}/bookmakers/${bk.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/go/${bk.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  for (const code of nationalTeams) {
    xml += `
  <url>
    <loc>${baseUrl}/selection/${code.toLowerCase()}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
