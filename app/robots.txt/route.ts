export function GET() {
  // Stratégie :
  // - Googlebot : tout autorisé (sauf API et pages paramétrées sans valeur SEO).
  // - Google-Extended / GPTBot / OAI-SearchBot : autorisés explicitement pour
  //   maximiser les chances d'apparaître dans ChatGPT Search, Gemini, Perplexity.
  //   (Perplexity ne respecte pas robots.txt, mais la directive reste utile.)
  // - Applebot-Extended : autorisé (Apple Intelligence).
  // - Bots SEO agressifs (SemrushBot, AhrefsBot, MJ12bot, DotBot) : bloqués
  //   pour économiser bande passante et éviter le scraping commercial.
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /recherche
Disallow: /classement/
Disallow: /resultats
Disallow: /go/

# Bots IA — autorisés explicitement pour être cité/indexé par les LLMs
User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Bots SEO commerciaux — bloqués (scraping intensif sans valeur ajoutée)
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

Sitemap: https://360-foot.com/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
