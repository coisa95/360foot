import { createAnonClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const revalidate = 21600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const supabase = createAnonClient();
  const { data: bookmakers } = await supabase
    .from("bookmakers")
    .select("slug")
    .eq("active", true);
  return (bookmakers ?? []).map((b) => ({ slug: b.slug }));
}

const LOGOS: Record<string, string> = {
  "1xbet": "/images/bookmakers/1xbet.png",
  melbet: "/images/bookmakers/melbet.png",
  "1win": "/images/bookmakers/1win.svg",
  megapari: "/images/bookmakers/megapari.svg",
};

const PROMO_CODES: Record<string, string> = {
  "1xbet": "1WAFU",
  melbet: "1WAFU",
  "1win": "6MAP",
  megapari: "1WAFU",
};

const BONUS_TAGLINES: Record<string, string> = {
  "1xbet": "Bonus 100% jusqu'à 200 000 FCFA + 150 tours gratuits",
  melbet: "Bonus 200% automatique sur votre 1er dépôt",
  "1win": "Bonus 500% sur vos 4 premiers dépôts (+100%, +120%, +130%, +150%)",
  megapari: "Bonus 100% automatique sur votre 1er dépôt",
};

const BRAND: Record<string, { from: string; via: string; to: string; shadow: string; text: string }> = {
  "1xbet": { from: "#2563eb", via: "#1d4ed8", to: "#1e3a8a", shadow: "rgba(37,99,235,0.4)", text: "#93c5fd" },
  melbet: { from: "#f59e0b", via: "#ea580c", to: "#9a3412", shadow: "rgba(245,158,11,0.4)", text: "#fcd34d" },
  "1win": { from: "#06b6d4", via: "#0d9488", to: "#115e59", shadow: "rgba(6,182,212,0.4)", text: "#67e8f9" },
  megapari: { from: "#a855f7", via: "#7c3aed", to: "#4c1d95", shadow: "rgba(168,85,247,0.4)", text: "#c4b5fd" },
};

const DEFAULT_BRAND = { from: "#10b981", via: "#059669", to: "#064e3b", shadow: "rgba(16,185,129,0.4)", text: "#6ee7b7" };

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
  megapari: [
    "Cliquez sur le bouton ci-dessous",
    "Inscrivez-vous et entrez le code 1WAFU",
    "Faites un premier dépôt",
    "Recevez 100% de bonus immédiatement",
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
  const supabase = createAnonClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("name,slug,bonus_json")
    .eq("slug", slug)
    .single();

  if (!bookmaker) return { title: "Bookmaker introuvable" };

  const bonusMeta = bookmaker.bonus_json as Record<string, string> | null;
  const bonusLabel = bonusMeta ? bonusMeta["CI"] || bonusMeta["default"] || Object.values(bonusMeta)[0] : null;
  const title = `${bookmaker.name}${bonusLabel ? ` — ${bonusLabel}` : " — Bonus de bienvenue"}`;
  const description = `Obtenez le bonus ${bookmaker.name} en 2 minutes. Inscription rapide et bonus immédiat.`;

  return {
    title,
    description,
    alternates: { canonical: `https://360-foot.com/go/${slug}` },
    // Pages affiliées : noindex + nofollow pour ne pas gaspiller le crawl budget
    // et ne pas transmettre l'autorité SEO vers les bookmakers.
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
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
  const supabase = createAnonClient();

  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("id,name,slug,bonus_json,affiliate_url")
    .eq("slug", slug)
    .single();

  if (!bookmaker || !bookmaker.affiliate_url) {
    // Opt out of ISR cache for 404 — otherwise Next.js caches the
    // not-found response with HTTP 200, not 404.
    headers();
    notFound();
  }

  const logo = LOGOS[slug] || null;
  const steps = BONUS_STEPS[slug] || DEFAULT_STEPS;
  const promoCode = PROMO_CODES[slug] || null;
  const tagline = BONUS_TAGLINES[slug] || null;
  const brand = BRAND[slug] || DEFAULT_BRAND;

  const bonusJson = bookmaker.bonus_json as Record<string, string> | null;
  const bonusText = bonusJson
    ? bonusJson["CI"] || bonusJson["default"] || Object.values(bonusJson)[0] || null
    : null;

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
    <main className="min-h-screen text-slate-900 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="mx-auto max-w-xl px-4 py-5 sm:py-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* ══════════ HERO CARD ══════════ */}
        <div
          className="relative mt-5 sm:mt-8 overflow-hidden rounded-2xl p-5 sm:p-10 text-center card-elevated animate-fadeInUp"
          style={{
            background: `linear-gradient(135deg, ${brand.from}, ${brand.via}, ${brand.to})`,
            boxShadow: `0 20px 60px ${brand.shadow}, 0 0 80px ${brand.shadow}`,
          }}
        >
          {/* Decorative shimmer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
            }}
          />
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -left-5 -bottom-5 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white/5" />

          {logo && (
            <Image
              src={logo}
              alt={bookmaker.name}
              width={160}
              height={64}
              className="relative mx-auto h-10 sm:h-14 w-auto object-contain mb-3 sm:mb-5 drop-shadow-lg"
            />
          )}

          {bonusText && (
            <p className="relative text-xl sm:text-4xl font-extrabold font-display text-white drop-shadow-md leading-tight">
              {bonusText}
            </p>
          )}

          {tagline && (
            <p className="relative mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium" style={{ color: brand.text }}>
              {tagline}
            </p>
          )}

          {/* Promo code */}
          {promoCode && (
            <div className="relative mt-4 sm:mt-6 animate-fadeInUp delay-100">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-white/50 mb-1">Code promo exclusif</p>
              <div className="inline-flex items-center rounded-xl border-2 border-dashed border-white/30 bg-black/20 backdrop-blur-sm px-4 sm:px-8 py-1.5 sm:py-2.5">
                <span className="text-xl sm:text-3xl font-extrabold font-display tracking-[0.2em] text-white drop-shadow-sm">
                  {promoCode}
                </span>
              </div>
            </div>
          )}

          {/* CTA principal */}
          <div className="relative mt-4 sm:mt-7 animate-fadeInUp delay-200">
            <a
              href={bookmaker.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="btn-neon w-full sm:w-auto !rounded-xl !px-8 !py-3 sm:!py-4 !text-sm sm:!text-base"
              style={{
                background: "#fff",
                color: brand.from,
                boxShadow: `0 0 25px rgba(255,255,255,0.3), 0 8px 30px ${brand.shadow}`,
              }}
            >
              Obtenir mon bonus maintenant
            </a>
          </div>
        </div>

        {/* ══════════ STEPS ══════════ */}
        <div className="mt-7 sm:mt-10 animate-fadeInUp delay-300">
          <h2 className="text-center text-[10px] sm:text-xs font-extrabold font-display uppercase tracking-[0.2em] text-slate-400 mb-1 sm:mb-2">
            Comment faire ?
          </h2>
          <p className="text-center text-[10px] text-slate-500 mb-4 sm:mb-6">Prend moins de 2 minutes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Connector line (desktop only, not on last) */}
                {i < steps.length - 1 && (
                  <div className="absolute top-3.5 sm:top-4 left-[calc(50%+18px)] right-0 h-px bg-gradient-to-r from-slate-200 to-transparent hidden sm:block" />
                )}
                <div
                  className="relative mx-auto flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[10px] sm:text-xs font-extrabold font-display text-slate-900 mb-2 sm:mb-3"
                  style={{
                    background: `linear-gradient(135deg, ${brand.from}, ${brand.to})`,
                    boxShadow: `0 4px 15px ${brand.shadow}`,
                  }}
                >
                  {i + 1}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ CTA 2 ══════════ */}
        <div className="mt-7 sm:mt-10 animate-fadeInUp delay-400">
          <a
            href={bookmaker.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="btn-neon w-full !rounded-xl !py-3 sm:!py-4 !text-sm sm:!text-base"
            style={{
              background: `linear-gradient(135deg, ${brand.from}, ${brand.via})`,
              boxShadow: `0 0 30px ${brand.shadow}`,
            }}
          >
            <span>S&apos;inscrire sur {bookmaker.name}</span>
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          {promoCode && (
            <p className="mt-2 text-center text-xs sm:text-sm font-bold text-slate-400">
              Code promo : <span className="font-extrabold font-display tracking-wider" style={{ color: brand.text }}>{promoCode}</span>
            </p>
          )}
        </div>

        {/* ══════════ Disclaimer ══════════ */}
        <div className="mt-6 sm:mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed text-slate-500">
          <p className="font-bold text-slate-700 mb-1">Avertissement — Jeu responsable</p>
          <p>
            Les jeux d&apos;argent comportent des risques : endettement, isolement,
            dépendance. À consommer avec modération. Interdit aux mineurs (18+).
            Ce lien est un lien d&apos;affiliation : 360 Foot perçoit une
            commission si vous ouvrez un compte, sans surcoût pour vous. Notre
            recommandation éditoriale reste indépendante. Conditions complètes
            du bonus disponibles sur le site du bookmaker.
          </p>
          <p className="mt-2">
            Besoin d&apos;aide ?{" "}
            <a
              href="https://www.joueurs-info-service.fr/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-emerald-600 underline"
            >
              Joueurs Info Service
            </a>{" "}
            — appel gratuit, confidentiel et anonyme.
          </p>
        </div>
      </div>
    </main>
  );
}
