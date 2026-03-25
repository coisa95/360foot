interface LinkEntity {
  name: string;
  slug: string;
}

/**
 * Add internal links to article content by replacing team, player, and league
 * names with anchor tags pointing to their respective pages.
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
      const link = `<a href="/${entity.type}/${entity.slug}">${original}</a>`;
      result =
        result.slice(0, match.index) +
        link +
        result.slice(match.index + original.length);
      linked.add(entity.name);
    }
  }

  return result;
}
