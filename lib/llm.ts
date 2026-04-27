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
// DeepSeek expose son cache via `prompt_cache_hit_tokens` /
// `prompt_cache_miss_tokens`. Les hits sont 10× moins chers que les miss.
// On comptabilise donc :
//   - `input` = prompt_tokens - prompt_cache_hit_tokens (vrai input "miss")
//   - `cacheRead` = prompt_cache_hit_tokens
// `cacheCreate` reste à 0 (DeepSeek ne facture pas l'écriture du cache).
export const tokenUsage = {
  input: 0,
  output: 0,
  cacheCreate: 0, // gardé pour compat health endpoint, restera à 0
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

// Tarifs DeepSeek (avril 2026, USD / 1M tokens) — deepseek-chat.
// Mise à jour manuelle si DeepSeek change la grille.
const PRICE_INPUT = 0.14 / 1_000_000;
const PRICE_CACHE_HIT = 0.014 / 1_000_000; // 10× moins cher que input "miss"
const PRICE_OUTPUT = 0.28 / 1_000_000;

export function getEstimatedSpendUSD(): number {
  return (
    tokenUsage.input * PRICE_INPUT +
    tokenUsage.cacheRead * PRICE_CACHE_HIT +
    tokenUsage.output * PRICE_OUTPUT
  );
}

/**
 * Generate an article or text content using DeepSeek (OpenAI-compatible API).
 *
 * @param systemPrompt - The system prompt. DeepSeek auto-cache les préfixes
 *   identiques côté serveur — pas besoin de marquage manuel comme avec Claude.
 * @param userPrompt - The user prompt with the specific request.
 * @param model - The model to use (defaults to deepseek-chat).
 * @param options - Options additionnelles :
 *   - `jsonMode` : force `response_format: { type: "json_object" }` côté
 *     DeepSeek. Le modèle doit alors retourner du JSON valide. À utiliser
 *     dès qu'un caller fait `JSON.parse()` sur la réponse pour éliminer
 *     les erreurs de parsing dues à du texte parasite (markdown fences,
 *     préambule). Note DeepSeek : le prompt doit explicitement demander
 *     du JSON, sinon le modèle peut bouclet en retournant du whitespace.
 * @returns The generated text response.
 */
export async function generateArticle(
  systemPrompt: string,
  userPrompt: string,
  model: string = "deepseek-chat",
  options?: { jsonMode?: boolean }
): Promise<string> {
  // Si un caller passe encore un nom de modèle Claude historique, on bascule
  // vers deepseek-chat sans casser l'appel.
  const effectiveModel = model.startsWith("claude") ? "deepseek-chat" : model;
  const startTime = Date.now();

  try {
    const completion = await client.chat.completions.create({
      model: effectiveModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
      // 1.3 = recommandation DeepSeek pour news / contenu créatif (range 0-2.0).
      // Si trop d'hallucinations en prod → revenir à 1.0.
      temperature: 1.3,
      ...(options?.jsonMode
        ? { response_format: { type: "json_object" as const } }
        : {}),
    });

    // Accumulation des métriques token. On distingue les cache hits (facturés
    // 10× moins) du vrai input "miss" pour avoir une estimation de spend
    // plus fidèle dans /api/health.
    tokenUsage.calls += 1;
    if (completion.usage) {
      const promptTokens = completion.usage.prompt_tokens || 0;
      // DeepSeek expose prompt_cache_hit_tokens dans l'objet usage étendu.
      // Le SDK OpenAI ne le type pas → on cast prudemment.
      const cacheHit =
        (completion.usage as unknown as { prompt_cache_hit_tokens?: number })
          .prompt_cache_hit_tokens || 0;
      tokenUsage.input += promptTokens - cacheHit;
      tokenUsage.cacheRead += cacheHit;
      tokenUsage.output += completion.usage.completion_tokens || 0;
    }

    if (process.env.LLM_LOG_USAGE !== "false") {
      const cacheHit =
        (completion.usage as unknown as { prompt_cache_hit_tokens?: number })
          ?.prompt_cache_hit_tokens || 0;
      console.log(
        `[LLM] model=${effectiveModel} ` +
          `prompt_tokens=${completion.usage?.prompt_tokens ?? 0} ` +
          `cache_hit=${cacheHit} ` +
          `output_tokens=${completion.usage?.completion_tokens ?? 0} ` +
          `duration_ms=${Date.now() - startTime} ` +
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
