import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Generate an article or text content using Claude.
 * @param systemPrompt - The system prompt to set context
 * @param userPrompt - The user prompt with the specific request
 * @param model - The model to use (defaults to claude-haiku-4-5-20251001)
 * @returns The generated text response
 */
export async function generateArticle(
  systemPrompt: string,
  userPrompt: string,
  model: string = "claude-haiku-4-5-20251001"
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

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
