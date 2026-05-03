/**
 * WhatsApp Channel configuration
 *
 * Set NEXT_PUBLIC_WHATSAPP_URL in .env (and Coolify) to your channel URL.
 * Example: https://whatsapp.com/channel/0029Va6YzYpFCa1YqXxyz123
 *
 * If the env var is missing, the component returns null and nothing renders
 * (so site doesn't break before the channel exists).
 */

export const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || "";

export type WhatsAppMessage =
  | "streaming-weekend"
  | "pronos-daily"
  | "africa-alerts"
  | "weekend-fixtures"
  | "social-proof";

export type WhatsAppPlacement =
  | "sticky-mobile"
  | "inline-card"
  | "footer-link"
  | "popup"
  | "hero-section"
  | "post-pronostic";

/** Get the WhatsApp URL with UTM tracking for a given placement. */
export function getWhatsAppUrl(placement: WhatsAppPlacement): string {
  if (!WHATSAPP_URL) return "";
  const url = new URL(WHATSAPP_URL);
  // UTM tagging so we can track conversions per placement in WhatsApp
  // analytics or reverse-engineer via referrer of mobile app installs.
  url.searchParams.set("utm_source", "360foot");
  url.searchParams.set("utm_medium", "cta");
  url.searchParams.set("utm_campaign", placement);
  return url.toString();
}

/** Pre-written CTA copy variants. Choose by audience intent. */
export const CTA_COPY: Record<
  WhatsAppMessage,
  { title: string; subtitle: string; button: string }
> = {
  "streaming-weekend": {
    title: "Reçois les liens streaming chaque week-end",
    subtitle:
      "Tous les matchs du samedi/dimanche, chaînes par pays et alternatives gratuites — directement sur WhatsApp",
    button: "Rejoindre WhatsApp",
  },
  "pronos-daily": {
    title: "Pronostics + cotes en avance",
    subtitle:
      "Reçois nos analyses et les meilleures cotes des bookmakers chaque matin avant les matchs",
    button: "Activer les pronos WhatsApp",
  },
  "africa-alerts": {
    title: "Alertes streaming live + VPN gratuits",
    subtitle:
      "Reçois en direct les liens pour regarder le foot depuis l'Afrique francophone",
    button: "Rejoindre la chaîne",
  },
  "weekend-fixtures": {
    title: "Tous les matchs du week-end",
    subtitle:
      "Calendrier complet + chaînes en avant-première chaque vendredi soir",
    button: "Recevoir le programme",
  },
  "social-proof": {
    title: "Rejoins 1 200+ supporters foot Afrique",
    subtitle:
      "La chaîne WhatsApp officielle 360 Foot — pronos, streaming, exclus quotidiens",
    button: "Suivre la chaîne",
  },
};
