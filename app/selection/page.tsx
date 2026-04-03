import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sélections nationales africaines",
  description:
    "Suivez les sélections nationales africaines : Côte d'Ivoire, Sénégal, Cameroun, Mali et Burkina Faso. Matchs, résultats et actualités.",
  alternates: {
    canonical: "https://360-foot.com/selection",
  },
  openGraph: {
    title: "Sélections nationales africaines - 360 Foot",
    description:
      "Suivez les sélections nationales africaines : matchs, résultats et actualités.",
    type: "website",
    url: "https://360-foot.com/selection",
    locale: "fr_FR",
  },
};

const SELECTIONS = [
  { code: "ci", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "sn", name: "Sénégal", flag: "🇸🇳" },
  { code: "cm", name: "Cameroun", flag: "🇨🇲" },
  { code: "ml", name: "Mali", flag: "🇲🇱" },
  { code: "bf", name: "Burkina Faso", flag: "🇧🇫" },
];

export default function SelectionIndexPage() {
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Sélections" },
  ];

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <h1 className="mt-4 text-xl font-bold sm:text-2xl md:text-3xl">
          <span className="text-lime-400">Sélections</span> nationales
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Suivez les équipes nationales africaines : matchs, résultats et
          actualités.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SELECTIONS.map((sel) => (
            <Link
              key={sel.code}
              href={`/selection/${sel.code}`}
              className="group flex items-center gap-4 rounded-xl border border-dark-border/50 bg-dark-card/80 p-5 transition-all hover:border-lime-500/20 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="text-4xl">{sel.flag}</span>
              <div>
                <h2 className="text-lg font-semibold text-white transition-colors group-hover:text-lime-400">
                  {sel.name}
                </h2>
                <p className="text-xs text-gray-500">Équipe nationale</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
