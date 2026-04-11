import Link from "next/link";
import { safeJsonLd } from "@/lib/json-ld";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `https://360-foot.com${item.href}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <nav aria-label="Fil d'Ariane" className="mb-4 overflow-hidden">
        <ol className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap overflow-hidden">
          {items.map((item, index) => (
            <li key={index} className={`flex items-center gap-1 shrink-0 ${index === items.length - 1 ? "min-w-0 shrink" : ""}`}>
              {index > 0 && <span className="text-gray-600" aria-hidden="true">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-emerald-400"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-400 truncate">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
