import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================================
// Token usage tracking (process-local aggregator)
// ============================================================================
// Chaque appel incrémente ce compteur. Le cron /api/cron/token-report (ou un
// simple endpoint d'inspection) peut le lire pour alerter si la facture
// journalière dépasse un budget. Compteur réinitialisé au redémarrage du
// container — c'est volontaire : la vérité source est la console Anthropic.
export const tokenUsage = {
  input: 0,
  output: 0,
  cacheCreate: 0,
  cacheRead: 0,
  calls: 0,
  reset() {
    this.input = 0;
    this.output = 0;
    this.cacheCreate = 0;
    this.cacheRead = 0;
    this.calls = 0;
  },
};

// Tarifs approximatifs claude-haiku-4-5 (USD / 1M tokens).
// Mise à jour manuelle si Anthropic change la grille.
const PRICE_INPUT = 1.0 / 1_000_000;
const PRICE_OUTPUT = 5.0 / 1_000_000;
const PRICE_CACHE_WRITE = 1.25 / 1_000_000;
const PRICE_CACHE_READ = 0.1 / 1_000_000;

export function getEstimatedSpendUSD(): number {
  return (
    tokenUsage.input * PRICE_INPUT +
    tokenUsage.output * PRICE_OUTPUT +
    tokenUsage.cacheCreate * PRICE_CACHE_WRITE +
    tokenUsage.cacheRead * PRICE_CACHE_READ
  );
}

/**
 * Generate an article or text content using Claude.
 *
 * @param systemPrompt - The system prompt (will be prompt-cached if long enough).
 *   Le system prompt est marqué `cache_control: ephemeral` quand il dépasse
 *   1024 caractères. Pour les 12 crons qui génèrent des articles avec un
 *   prompt système quasi-identique, cela divise le coût input par ~10.
 * @param userPrompt - The user prompt with the specific request.
 * @param model - The model to use (defaults to claude-haiku-4-5-20251001).
 * @returns The generated text response.
 */
export async function generateArticle(
  systemPrompt: string,
  userPrompt: string,
  model: string = "claude-haiku-4-5-20251001"
): Promise<string> {
  try {
    // Prompt caching : on ne cache que si le system est assez gros pour
    // rentabiliser les 25% de surcoût d'écriture du cache.
    const useCache = systemPrompt.length > 1024;
    const system = useCache
      ? [
          {
            type: "text" as const,
            text: systemPrompt,
            cache_control: { type: "ephemeral" as const },
          },
        ]
      : systemPrompt;

    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Accumulation des métriques token
    const usage = message.usage as unknown as {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    tokenUsage.calls += 1;
    tokenUsage.input += usage?.input_tokens || 0;
    tokenUsage.output += usage?.output_tokens || 0;
    tokenUsage.cacheCreate += usage?.cache_creation_input_tokens || 0;
    tokenUsage.cacheRead += usage?.cache_read_input_tokens || 0;

    if (process.env.CLAUDE_LOG_USAGE === "1") {
      console.log(
        `[claude] call #${tokenUsage.calls} in=${usage?.input_tokens} out=${usage?.output_tokens} ` +
          `cache_w=${usage?.cache_creation_input_tokens || 0} cache_r=${usage?.cache_read_input_tokens || 0} ` +
          `~$${getEstimatedSpendUSD().toFixed(4)} cumul`
      );
    }

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    return textBlock.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error: ${error.status} - ${error.message}`);
      throw new Error(`Claude API error: ${error.message}`);
    }
    throw error;
  }
}
