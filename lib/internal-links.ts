interface LinkEntity {
  name: string;
  slug: string;
}

/**
 * Add internal links to article content by replacing team, player, and league
 * names with anchor tags pointing to their respective pages.
 * Also adds contextual links for keywords like "classement" and "transfert".
 *
 * Only the first occurrence of each name is linked to avoid over-linking.
 *
 * @param content - The HTML article content
 * @param teams - Array of team objects with name and slug
 * @param players - Array of player objects with name and slug
 * @param leagues - Array of league objects with name and slug
 * @returns The content with internal links added
 */
export function addInternalLinks(
  content: string,
  teams: LinkEntity[],
  players: LinkEntity[],
  leagues: LinkEntity[]
): string {
  let result = content;
  const linked = new Set<string>();

  // Sort all entities by name length (longest first) to avoid partial replacements
  const allEntities = [
    ...teams.map((t) => ({ ...t, type: "equipe" as const })),
    ...players.map((p) => ({ ...p, type: "joueur" as const })),
    ...leagues.map((l) => ({ ...l, type: "ligue" as const })),
  ].sort((a, b) => b.name.length - a.name.length);

  for (const entity of allEntities) {
    if (linked.has(entity.name)) continue;

    // Escape special regex characters in the entity name
    const escaped = entity.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Match the entity name only when it is NOT already inside an HTML tag or anchor
    const regex = new RegExp(
      `(?<!<[^>]*)\\b(${escaped})\\b(?![^<]*>)`,
      "i"
    );

    const match = result.match(regex);
    if (match && match.index !== undefined) {
      const original = match[1];
      const link = `<a href="/${entity.type}/${entity.slug}" class="text-lime-400 hover:underline">${original}</a>`;
      result =
        result.slice(0, match.index) +
        link +
        result.slice(match.index + original.length);
      linked.add(entity.name);
    }
  }

  // Add contextual keyword links (only first occurrence of each)
  const keywordLinks: Array<{
    patterns: string[];
    href: string;
    label?: string;
  }> = [
    {
      patterns: ["transferts", "mercato", "recrutement"],
      href: "/transferts",
    },
    {
      patterns: ["résultats", "resultats", "scores"],
      href: "/matchs",
    },
  ];

  // Add "classement" links for each league
  for (const league of leagues) {
    const escapedName = league.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const classementRegex = new RegExp(
      `(?<!<[^>]*)\\b(classement\\s+(?:de\\s+(?:la\\s+|l')?)?${escapedName})\\b(?![^<]*>)`,
      "i"
    );
    const classementMatch = result.match(classementRegex);
    if (classementMatch && classementMatch.index !== undefined && !linked.has(`classement_${league.slug}`)) {
      const original = classementMatch[1];
      const link = `<a href="/ligue/${league.slug}" class="text-lime-400 hover:underline">${original}</a>`;
      result =
        result.slice(0, classementMatch.index) +
        link +
        result.slice(classementMatch.index + original.length);
      linked.add(`classement_${league.slug}`);
    }
  }

  // Generic "classement" link (if no specific league classement was linked)
  if (!Array.from(linked).some((k) => k.startsWith("classement_"))) {
    const classementRegex = /(?<!<[^>]*)\b(classement)\b(?![^<]*>)/i;
    const classementMatch = result.match(classementRegex);
    if (classementMatch && classementMatch.index !== undefined && !linked.has("classement")) {
      const original = classementMatch[1];
      // Try to find the most relevant league for the context
      const defaultLeague = leagues.length > 0 ? leagues[0] : null;
      const href = defaultLeague ? `/ligue/${defaultLeague.slug}` : "/actu";
      const link = `<a href="${href}" class="text-lime-400 hover:underline">${original}</a>`;
      result =
        result.slice(0, classementMatch.index) +
        link +
        result.slice(classementMatch.index + original.length);
      linked.add("classement");
    }
  }

  // Apply keyword links
  for (const kwLink of keywordLinks) {
    for (const pattern of kwLink.patterns) {
      if (linked.has(pattern)) continue;

      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(?<!<[^>]*)\\b(${escaped})\\b(?![^<]*>)`,
        "i"
      );

      const match = result.match(regex);
      if (match && match.index !== undefined) {
        const original = match[1];
        const link = `<a href="${kwLink.href}" class="text-lime-400 hover:underline">${original}</a>`;
        result =
          result.slice(0, match.index) +
          link +
          result.slice(match.index + original.length);
        linked.add(pattern);
        break; // Only link the first matching pattern per keyword group
      }
    }
  }

  return result;
}
