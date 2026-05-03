import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { getCspNonce } from "@/lib/csp-nonce";
import { INDEXABLE_ROBOTS } from "@/lib/seo-helpers";
import { Breadcrumb } from "@/components/breadcrumb";
import { WhatsAppHeroSection } from "@/components/whatsapp-cta";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AffiliateTrio } from "@/components/affiliate-trio";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Streaming foot — Toutes les chaînes, alternatives gratuites et VPN | 360 Foot",
  description:
    "Où regarder le football en direct ce soir : toutes les chaînes officielles, streaming gratuit légal, VPN et solutions par pays (Côte d'Ivoire, Sénégal, Cameroun, France, Maroc...). Mis à jour chaque jour.",
  robots: INDEXABLE_ROBOTS,
  alternates: { canonical: "https://360-foot.com/streaming" },
  openGraph: {
    title: "Streaming foot — Où regarder les matchs en direct",
    description:
      "Toutes les chaînes, alternatives gratuites et solutions par pays pour regarder le foot en streaming.",
    type: "website",
    url: "https://360-foot.com/streaming",
    locale: "fr_FR",
    images: [
      "https://360-foot.com/api/og?title=Streaming+foot+%E2%80%94+Toutes+les+cha%C3%AEnes+et+alternatives&type=streaming",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Streaming foot — Toutes les chaînes et alternatives",
    description:
      "Où regarder le football en streaming ce soir. Chaînes par pays, alternatives gratuites, VPN.",
    images: [
      "https://360-foot.com/api/og?title=Streaming+foot+%E2%80%94+Toutes+les+cha%C3%AEnes+et+alternatives&type=streaming",
    ],
  },
};

/** Major football leagues to surface in "by competition" grid. */
const FEATURED_LEAGUES = [
  { slug: "premier-league", name: "Premier League", country: "Angleterre", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { slug: "la-liga", name: "La Liga", country: "Espagne", emoji: "🇪🇸" },
  { slug: "ligue-1-france", name: "Ligue 1", country: "France", emoji: "🇫🇷" },
  { slug: "bundesliga", name: "Bundesliga", country: "Allemagne", emoji: "🇩🇪" },
  { slug: "serie-a", name: "Serie A", country: "Italie", emoji: "🇮🇹" },
  { slug: "champions-league", name: "Champions League", country: "Europe", emoji: "🏆" },
  { slug: "ligue-1-cote-divoire", name: "Ligue 1 Côte d'Ivoire", country: "Côte d'Ivoire", emoji: "🇨🇮" },
  { slug: "botola-pro", name: "Botola Pro", country: "Maroc", emoji: "🇲🇦" },
  { slug: "linafoot", name: "Linafoot", country: "RD Congo", emoji: "🇨🇩" },
  { slug: "fasofoot", name: "Fasofoot", country: "Burkina Faso", emoji: "🇧🇫" },
  { slug: "elite-one-cameroun", name: "Elite One", country: "Cameroun", emoji: "🇨🇲" },
  { slug: "can", name: "CAN", country: "Afrique", emoji: "🌍" },
];

/** Target countries for geo-streaming sub-hubs. */
const COUNTRIES = [
  { code: "ci", name: "Côte d'Ivoire", emoji: "🇨🇮", channel: "Canal+ Sport Afrique" },
  { code: "sn", name: "Sénégal", emoji: "🇸🇳", channel: "Canal+ Sport Afrique" },
  { code: "cm", name: "Cameroun", emoji: "🇨🇲", channel: "Canal+ Sport Afrique / SuperSport" },
  { code: "ma", name: "Maroc", emoji: "🇲🇦", channel: "beIN Sports / Arryadia" },
  { code: "tn", name: "Tunisie", emoji: "🇹🇳", channel: "beIN Sports" },
  { code: "fr", name: "France", emoji: "🇫🇷", channel: "Canal+ Sport / beIN Sports" },
  { code: "ml", name: "Mali", emoji: "🇲🇱", channel: "Canal+ Sport Afrique" },
  { code: "bf", name: "Burkina Faso", emoji: "🇧🇫", channel: "Canal+ Sport Afrique" },
];

const FAQ_QUESTIONS = [
  {
    q: "Comment regarder un match de foot en streaming gratuitement et légalement ?",
    a: "Plusieurs options gratuites légales existent : Molotov.tv (RMC Sport en version free), L'Équipe Live pour le commentaire en direct, DAZN avec son essai gratuit de 30 jours, ou les streams officiels YouTube de certains championnats. Pour les matchs importants en clair, suivez aussi les chaînes hertziennes nationales (TF1 pour l'équipe de France, par exemple).",
  },
  {
    q: "Quelle chaîne diffuse les matchs de Premier League en France et en Afrique ?",
    a: "En France, la Premier League est diffusée sur Canal+ Sport. En Afrique francophone (Côte d'Ivoire, Sénégal, Cameroun, etc.), c'est Canal+ Sport Afrique qui détient les droits. Au Maroc et en Tunisie, beIN Sports diffuse la majorité des matchs.",
  },
  {
    q: "Comment regarder le foot en streaming depuis l'Afrique ?",
    a: "Les options principales sont : un abonnement Canal+ Sport Afrique (le plus complet pour le foot européen et africain), beIN Connect au Maroc/Tunisie, ou via les bookmakers comme 1xbet et Betwinner qui proposent un live streaming gratuit après inscription et premier dépôt. Un VPN peut aussi débloquer les diffuseurs européens.",
  },
  {
    q: "Quel est le meilleur VPN pour regarder le foot en streaming ?",
    a: "Les VPN les plus utilisés pour le streaming sportif sont ExpressVPN, NordVPN et Surfshark. Ils permettent de contourner le geo-blocking pour accéder aux diffuseurs RTBF (Belgique, certains matchs CL gratuits), DAZN, ou encore les chaînes étrangères. Vérifiez toujours les conditions d'utilisation des plateformes.",
  },
  {
    q: "Peut-on regarder le foot en streaming sur mobile ?",
    a: "Oui, toutes les grandes plateformes proposent des apps mobiles : myCANAL, beIN Connect, Molotov, DAZN, RMC Sport. Sur Android et iOS, vous pouvez aussi caster vers une Smart TV via Chromecast ou Apple TV.",
  },
  {
    q: "Pourquoi certains liens de streaming gratuits sont illégaux ?",
    a: "De nombreux sites streaming non-officiels diffusent les matchs sans droits, ce qui est illégal et expose les utilisateurs à des risques (logiciels malveillants, vol de données, amendes). Privilégiez toujours les options légales gratuites (essais gratuits DAZN, Molotov, YouTube officiel) ou les abonnements officiels.",
  },
  {
    q: "Combien coûte un abonnement Canal+ Sport en Afrique francophone ?",
    a: "L'abonnement Canal+ Sport Afrique varie selon le pays : entre 15 000 et 25 000 FCFA/mois en zone CFA, environ 250 MAD/mois au Maroc. Des promotions sont régulièrement proposées sur la première année. Le pack Tout Canal+ inclut généralement Sport, Cinéma, Séries.",
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function StreamingHubPage() {
  const supabase = createAnonClient();
  const nonce = await getCspNonce();

  // Date boundaries
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 8);

  // Fetch streaming articles linked to upcoming matches.
  // We pull a generous batch and split client-side by date for the tabs.
  const { data: streamingArticles } = await supabase
    .from("articles")
    .select(
      "id,slug,title,published_at,match_id,match:matches!inner(slug,date,status,score_home,score_away,home_team:teams!home_team_id(name,slug,logo_url),away_team:teams!away_team_id(name,slug,logo_url),league:leagues!league_id(name,slug,logo_url))"
    )
    .eq("type", "streaming")
    .gte("match.date", todayStart.toISOString())
    .lte("match.date", weekEnd.toISOString())
    .order("match(date)", { ascending: true })
    .limit(60);

  const articles = (streamingArticles || []) as any[];
  const todayArticles = articles.filter(
    (a) => new Date(a.match.date) < tomorrowStart
  );
  const tomorrowArticles = articles.filter(
    (a) =>
      new Date(a.match.date) >= tomorrowStart &&
      new Date(a.match.date) < dayAfterTomorrow
  );
  const weekArticles = articles.filter(
    (a) => new Date(a.match.date) >= dayAfterTomorrow
  );

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Streaming" },
  ];

  // ── JSON-LD ──
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Streaming football — Toutes les chaînes et alternatives",
    description:
      "Où regarder le foot en streaming aujourd'hui : chaînes officielles, alternatives gratuites, VPN par pays.",
    url: "https://360-foot.com/streaming",
    inLanguage: "fr",
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://360-foot.com/#website",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://360-foot.com" },
        { "@type": "ListItem", position: 2, name: "Streaming", item: "https://360-foot.com/streaming" },
      ],
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_QUESTIONS.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };

  return (
    <main className="min-h-screen text-slate-900">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* ─── Hero ─── */}
        <section className="mt-6">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-3">
            Mis à jour aujourd&apos;hui
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Où regarder le football en streaming et à la TV
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            Toutes les chaînes officielles, alternatives gratuites légales et solutions VPN
            pour regarder le foot en direct depuis la France, l&apos;Afrique francophone et le
            Maghreb. Mis à jour chaque jour.
          </p>
        </section>

        {/* ─── WhatsApp Hero CTA ─── */}
        <div className="mt-8">
          <WhatsAppHeroSection
            placement="hero-section"
            message="streaming-weekend"
          />
        </div>

        {/* ─── Aujourd'hui ─── */}
        {todayArticles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Matchs aujourd&apos;hui
              </h2>
              <span className="text-sm text-slate-500">
                {todayArticles.length} match{todayArticles.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayArticles.slice(0, 9).map((a) => (
                <MatchStreamingCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Demain ─── */}
        {tomorrowArticles.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Matchs demain
              </h2>
              <span className="text-sm text-slate-500">
                {tomorrowArticles.length} match{tomorrowArticles.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tomorrowArticles.slice(0, 6).map((a) => (
                <MatchStreamingCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Cette semaine ─── */}
        {weekArticles.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Cette semaine
              </h2>
              <span className="text-sm text-slate-500">
                {weekArticles.length} match{weekArticles.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekArticles.slice(0, 9).map((a) => (
                <MatchStreamingCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Affiliés ─── */}
        <div className="mt-12">
          <AffiliateTrio />
        </div>

        {/* ─── Streaming par compétition ─── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Streaming par compétition
          </h2>
          <p className="text-slate-600 mb-6">
            Sélectionnez votre championnat pour découvrir où regarder chaque match en direct.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FEATURED_LEAGUES.map((l) => (
              <Link
                key={l.slug}
                href={`/ligue/${l.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl shrink-0">{l.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {l.name}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">{l.country}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Streaming par pays (mer bleue Afrique) ─── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Streaming par pays
          </h2>
          <p className="text-slate-600 mb-6">
            Quelles chaînes diffusent le foot dans votre pays ? Toutes les options TV +
            streaming.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="text-3xl shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-slate-900 text-base leading-tight">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.channel}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Pages détaillées par pays bientôt disponibles.
          </p>
        </section>

        {/* ─── Alternatives gratuites légales ─── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Alternatives gratuites légales
          </h2>
          <p className="text-slate-600 mb-6">
            5 façons de regarder le foot en streaming sans abonnement payant et sans risque.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Molotov.tv",
                desc: "Plateforme française gratuite. RMC Sport News inclus + chaînes hertziennes (matchs équipe de France TF1).",
                tag: "FRANCE",
              },
              {
                name: "L'Équipe Live",
                desc: "Score en direct + commentaires textuels. Pas de vidéo mais idéal au bureau ou sans connexion forte.",
                tag: "TOUS PAYS",
              },
              {
                name: "DAZN essai gratuit",
                desc: "30 jours offerts à l'inscription. Couvre Premier League, Bundesliga, Serie A selon les pays.",
                tag: "EUROPE",
              },
              {
                name: "YouTube officiel",
                desc: "Résumés et highlights après match. Certains championnats africains diffusent en direct (CAF Cup).",
                tag: "TOUS PAYS",
              },
              {
                name: "RTBF Auvio",
                desc: "TV publique belge avec certains matchs Champions League en clair (gratuit avec VPN Belgique).",
                tag: "VPN BELGIQUE",
              },
              {
                name: "Bookmaker live (1xbet, Betwinner)",
                desc: "Streaming gratuit après inscription + premier dépôt. Idéal pour les matchs africains et exotiques.",
                tag: "AFFILIÉ",
              },
            ].map((alt) => (
              <Card
                key={alt.name}
                className="border-slate-200 p-5 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] mb-2">
                  {alt.tag}
                </Badge>
                <p className="font-display font-bold text-slate-900 text-base">
                  {alt.name}
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{alt.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ_QUESTIONS.map((qa, i) => (
              <details
                key={i}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-emerald-200 transition-colors"
              >
                <summary className="cursor-pointer font-display font-bold text-slate-900 text-base sm:text-lg list-none flex items-center justify-between gap-4">
                  <span>{qa.q}</span>
                  <span className="shrink-0 text-emerald-600 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {qa.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Footer note ─── */}
        <p className="mt-12 text-center text-xs text-slate-400">
          Les liens streaming changent fréquemment selon les droits TV. Cette page est mise à
          jour quotidiennement par notre équipe et nos crons match-data.
        </p>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Match streaming card — used in 3 grids (today/tomorrow/week)         */
/* ────────────────────────────────────────────────────────────────────── */

function MatchStreamingCard({ article }: { article: any }) {
  const m = article.match;
  if (!m) return null;
  const home = m.home_team;
  const away = m.away_team;
  const date = new Date(m.date);
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/actu/${article.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      {/* Top : league + time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {m.league?.logo_url && (
            <Image
              src={m.league.logo_url}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 object-contain shrink-0"
              unoptimized
            />
          )}
          <span className="text-[11px] font-medium text-slate-500 line-clamp-1">
            {m.league?.name || ""}
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 shrink-0">
          {dateStr} · {timeStr}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {home?.logo_url && (
            <Image
              src={home.logo_url}
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
              unoptimized
            />
          )}
          <span className="font-medium text-slate-900 text-sm line-clamp-1">
            {home?.name || "Équipe A"}
          </span>
        </div>
        <span className="text-xs text-slate-400 shrink-0">vs</span>
        <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
          <span className="font-medium text-slate-900 text-sm line-clamp-1 text-right">
            {away?.name || "Équipe B"}
          </span>
          {away?.logo_url && (
            <Image
              src={away.logo_url}
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
              unoptimized
            />
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
          Comment regarder →
        </span>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
          Streaming
        </Badge>
      </div>
    </Link>
  );
}
