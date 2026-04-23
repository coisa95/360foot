import { headers } from "next/headers";

/**
 * Récupère le nonce CSP généré par le middleware pour la requête courante.
 *
 * Le middleware (`middleware.ts`) génère un nonce aléatoire par requête, le
 * pousse dans la CSP `script-src 'nonce-…' 'strict-dynamic' …` et l'injecte
 * dans les headers entrants sous la clé `x-nonce`. Les server components
 * peuvent le lire via cette fonction pour le passer aux `<script>` inline
 * (notamment les JSON-LD) afin qu'ils passent la CSP.
 *
 * Retourne `undefined` si le nonce est absent (ex: rendu en dehors d'une
 * requête HTTP comme pendant `next build`). Dans ce cas, React n'émettra
 * simplement pas l'attribut `nonce=""`.
 */
export function getCspNonce(): string | undefined {
  return headers().get("x-nonce") || undefined;
}
