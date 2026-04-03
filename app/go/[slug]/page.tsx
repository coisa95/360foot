import { createClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 21600;

type Props = {
  params: Promise<{ slug: string }>;
};

const LOGOS: Record<string, string> = {
  "1xbet": "/images/bookmakers/1xbet.png",
  melbet: "/images/bookmakers/melbet.png",
  "1win": "/images/bookmakers/1win.png",
};

const PROMO_CODES: Record<string, string> = {
  "1xbet": "1WAFU",
  melbet: "1WAFU",
  "1win": "6MAP",
};

const BONUS_TAGLINES: Record<string, string> = {
  "1xbet": "Bonus 100% jusqu'à 200 000 FCFA + 150 tours gratuits",
  melbet: "Bonus 200% automatique sur votre 1er dépôt",
  "1win": "Bonus 500% sur vos 4 premiers dépôts (+100%, +120%, +130%, +150%)",
};

// Brand colors per bookmaker
const BRAND: Record<string, { gradient: string; glow: string; accent: string; btn: string; ring: string }> = {
  "1xbet": {
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    glow: "shadow-blue-500/30",
    accent: "text-blue-300",
    btn: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/40",
    ring: "border-blue-400/50",
  },
  melbet: {
    gradient: "from-amber-500 via-orange-600 to-orange-800",
    glow: "shadow-amber-500/30",
    accent: "text-amber-300",
    btn: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/40",
    ring: "border-amber-400/50",
  },
  "1win": {
    gradient: "from-cyan-500 via-teal-600 to-teal-800",
    glow: "shadow-cyan-500/30",
    accent: "text-cyan-300",
    btn: "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/40",
    ring: "border-cyan-400/50",
  },
};

const DEFAULT_BRAND = {
  gradient: "from-lime-500 via-emerald-600 to-emerald-800",
  glow: "shadow-lime-500/30",
  accent: "text-lime-300",
  btn: "bg-lime-500 hover:bg-lime-400 shadow-lime-500/40",
  ring: "border-lime-400/50",
};

const BONUS_STEPS: Record<string, string[]> = {
  "1xbet": [
    "Cliquez sur le bouton ci-dessous",
    "Inscrivez-vous et entrez le code 1WAFU",
    "Faites un premier dépôt",
    "Recevez 100% de bonus immédiatement",
  ],
  melbet: [
    "Cliquez sur le bouton ci-dessous",
    "Inscrivez-vous et entrez le code 1WAFU",
    "Faites un premier dépôt",
    "Recevez 200% de bonus instantanément",
  ],
  "1win": [
    "Cliquez sur le bouton ci-dessous",
    "Inscrivez-vous et entrez le code 6MAP",
    "Faites un premier dépôt",
    "Recevez 500% de bonus sur 4 dépôts",
  ],
};

const DEFAULT_STEPS = [
  "Cliquez sur le bouton ci-dessous",
  "Créez votre compte",
  "Faites un premier dépôt",
  "Recevez votre bonus",
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("name,slug,bonus")
    .eq("slug", slug)
    .single();

  if (!bookmaker) return { title: "Bookmaker introuvable - 360 Foot" };

  const title = `${bookmaker.name} — Bonus de bienvenue${bookmaker.bonus ? ` ${bookmaker.bonus}` : ""}`;
  const description = `Obtenez le bonus ${bookmaker.name} en 2 minutes. Inscription rapide et bonus immédiat.`;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/go/${slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://360-foot.com/go/${slug}`,
      locale: "fr_FR",
    },
  };
}

export default async function GoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("id,name,slug,bonus,bonus_json,affiliate_url")
    .eq("slug", slug)
    .single();

  if (!bookmaker || !bookmaker.affiliate_url) notFound();

  const logo = LOGOS[slug] || null;
  const steps = BONUS_STEPS[slug] || DEFAULT_STEPS;
  const promoCode = PROMO_CODES[slug] || null;
  const tagline = BONUS_TAGLINES[slug] || null;
  const brand = BRAND[slug] || DEFAULT_BRAND;

  const bonusJson = bookmaker.bonus_json as Record<string, string> | null;
  const bonusText = bonusJson
    ? bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || bookmaker.bonus
    : bookmaker.bonus;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Paris sportifs", href: "/bookmakers" },
    { label: `Bonus ${bookmaker.name}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Obtenir le bonus ${bookmaker.name}`,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s,
    })),
  };

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* ══════════ HERO CARD ══════════ */}
        <div className={`relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br ${brand.gradient} p-6 sm:p-10 text-center shadow-2xl ${brand.glow}`}>
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-white/5" />

          {logo && (
            <Image
              src={logo}
              alt={bookmaker.name}
              width={160}
              height={64}
              className="relative mx-auto h-14 sm:h-16 w-auto object-contain mb-5 drop-shadow-lg"
            />
          )}

          {bonusText && (
            <p className="relative text-4xl sm:text-5xl font-black text-white drop-shadow-md leading-tight">
              {bonusText}
            </p>
          )}

          {tagline && (
            <p className={`relative mt-2 text-sm sm:text-base font-medium ${brand.accent}`}>
              {tagline}
            </p>
          )}

          {/* Promo code inside hero */}
          {promoCode && (
            <div className="relative mt-6">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 mb-1.5">Code promo exclusif</p>
              <div className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-white/30 bg-black/20 backdrop-blur-sm px-6 sm:px-10 py-3">
                <span className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white drop-shadow-sm">
                  {promoCode}
                </span>
              </div>
            </div>
          )}

          {/* CTA inside hero */}
          <div className="relative mt-8">
            <a
              href={bookmaker.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-block w-full sm:w-auto rounded-xl bg-white px-10 py-4 text-lg font-black text-gray-900 transition-all hover:scale-105 hover:shadow-2xl shadow-lg active:scale-100"
            >
              Obtenir mon bonus maintenant
            </a>
          </div>
        </div>

        {/* ══════════ STEPS ══════════ */}
        <div className="mt-10">
          <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
            Comment faire ?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector line (not on last) */}
                {i < steps.length - 1 && (
                  <div className="absolute top-4 left-[calc(50%+20px)] right-0 h-px bg-gradient-to-r from-gray-700 to-transparent hidden sm:block" />
                )}
                <div className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${brand.gradient} text-sm font-black text-white shadow-lg ${brand.glow} mb-3`}>
                  {i + 1}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ CTA 2 — full width, branded ══════════ */}
        <div className="mt-10">
          <a
            href={bookmaker.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`group flex items-center justify-center gap-3 w-full rounded-xl ${brand.btn} px-8 py-5 text-lg font-black text-dark-bg transition-all hover:scale-[1.02] shadow-lg active:scale-100`}
          >
            <span>S&apos;inscrire sur {bookmaker.name}</span>
            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          {promoCode && (
            <p className="mt-2 text-center text-sm font-bold text-gray-400">
              Code promo : <span className={`font-black tracking-wider ${brand.accent}`}>{promoCode}</span>
            </p>
          )}
        </div>

        {/* ══════════ Disclaimer ══════════ */}
        <p className="mt-8 text-center text-[10px] text-gray-600">
          18+ | Jeu responsable | Conditions sur le site du bookmaker | Lien d&apos;affiliation
        </p>
      </div>
    </main>
  );
}
