import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

// ============================================================================
// Token usage tracking (process-local aggregator)
// ============================================================================
// Chaque appel incrémente ce compteur. Le cron /api/cron/token-report (ou un
// simple endpoint d'inspection) peut le lire pour alerter si la facture
// journalière dépasse un budget. Compteur réinitialisé au redémarrage du
// container — c'est volontaire : la vérité source est la console DeepSeek.
//
// Note : on garde `cacheCreate` / `cacheRead` à 0 pour rester compatible avec
// l'endpoint /api/health qui les lit. DeepSeek expose son cache dans
// `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` (facturé à 0.014 /
// 1M tokens) mais le tarif moyen reste dominé par `input` ; on n'isole pas
// le cache hit ici pour garder la signature stable.
export const tokenUsage = {
  input: 0,
  output: 0,
  cacheCreate: 0, // gardé pour compat health endpoint, restera à 0
  cacheRead: 0, // pareil
  calls: 0,
  reset() {
    this.input = 0;
    this.output = 0;
    this.cacheCreate = 0;
    this.cacheRead = 0;
    this.calls = 0;
  },
};

// Tarifs DeepSeek (avril 2026, USD / 1M tokens) — deepseek-chat.
// Mise à jour manuelle si DeepSeek change la grille.
const PRICE_INPUT = 0.14 / 1_000_000;
const PRICE_OUTPUT = 0.28 / 1_000_000;

export function getEstimatedSpendUSD(): number {
  return tokenUsage.input * PRICE_INPUT + tokenUsage.output * PRICE_OUTPUT;
}

/**
 * Generate an article or text content using DeepSeek (OpenAI-compatible API).
 *
 * @param systemPrompt - The system prompt. DeepSeek auto-cache les préfixes
 *   identiques côté serveur — pas besoin de marquage manuel comme avec Claude.
 * @param userPrompt - The user prompt with the specific request.
 * @param model - The model to use (defaults to deepseek-chat).
 * @returns The generated text response.
 */
export async function generateArticle(
  systemPrompt: string,
  userPrompt: string,
  model: string = "deepseek-chat"
): Promise<string> {
  // Si un caller passe encore un nom de modèle Claude historique, on bascule
  // vers deepseek-chat sans casser l'appel.
  const effectiveModel = model.startsWith("claude") ? "deepseek-chat" : model;

  try {
    const completion = await client.chat.completions.create({
      model: effectiveModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    // Accumulation des métriques token
    tokenUsage.calls += 1;
    if (completion.usage) {
      tokenUsage.input += completion.usage.prompt_tokens || 0;
      tokenUsage.output += completion.usage.completion_tokens || 0;
    }

    if (process.env.LLM_LOG_USAGE === "1" || process.env.CLAUDE_LOG_USAGE === "1") {
      console.log(
        `[llm] call #${tokenUsage.calls} in=${completion.usage?.prompt_tokens} out=${completion.usage?.completion_tokens} ` +
          `~$${getEstimatedSpendUSD().toFixed(4)} cumul`
      );
    }

    const content = completion.choices[0]?.message?.content || "";
    if (!content) {
      throw new Error("No text content in DeepSeek response");
    }
    return content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(`DeepSeek API error: ${error.status} - ${error.message}`);
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
    throw error;
  }
}
