// ============================================
// Telegram Bot — Auto-publish articles to channel
// ============================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@foot360news";

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramArticle {
  title: string;
  slug: string;
  excerpt: string;
  type: string;
  imageUrl?: string;
  tags?: string[];
  league?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  trending: "📰",
  result: "⚽",
  preview: "🔮",
  transfer: "🔄",
  analysis: "📊",
};

const TYPE_LABEL: Record<string, string> = {
  trending: "Actualité",
  result: "Résultat",
  preview: "Avant-match",
  transfer: "Transfert",
  analysis: "Analyse",
};

function buildHashtags(article: TelegramArticle): string {
  const tags: string[] = [];

  if (article.league) {
    const leagueTag = article.league
      .replace(/[^a-zA-ZÀ-ÿ0-9]/g, "")
      .slice(0, 20);
    if (leagueTag) tags.push(`#${leagueTag}`);
  }

  if (article.tags) {
    for (const tag of article.tags.slice(0, 3)) {
      const clean = tag.replace(/[^a-zA-ZÀ-ÿ0-9]/g, "").slice(0, 20);
      if (clean && !tags.includes(`#${clean}`)) tags.push(`#${clean}`);
    }
  }

  tags.push("#360Foot");
  return tags.slice(0, 5).join(" ");
}

function buildMessage(article: TelegramArticle): string {
  const emoji = TYPE_EMOJI[article.type] || "📰";
  const label = TYPE_LABEL[article.type] || "Actualité";
  const hashtags = buildHashtags(article);
  const url = `https://360-foot.com/actu/${article.slug}`;

  // Truncate excerpt to 200 chars
  const excerpt =
    article.excerpt.length > 200
      ? article.excerpt.slice(0, 197) + "..."
      : article.excerpt;

  return `${emoji} <b>${label}</b>\n\n<b>${article.title}</b>\n\n${excerpt}\n\n${hashtags}\n\n👉 <a href="${url}">Lire l'article</a>`;
}

export async function publishToTelegram(
  article: TelegramArticle
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN not set, skipping Telegram publish");
    return false;
  }

  try {
    const message = buildMessage(article);

    // If article has an image, send as photo with caption
    if (article.imageUrl && !article.imageUrl.includes("/api/og")) {
      const res = await fetch(`${API_BASE}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL_ID,
          photo: article.imageUrl,
          caption: message,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();

      // If photo fails (e.g. invalid URL), fallback to text
      if (!data.ok) {
        console.log(
          `⚠️ Telegram photo failed (${data.description}), falling back to text`
        );
        return sendTextMessage(message);
      }

      console.log(`✅ Telegram: published with photo — ${article.title}`);
      return true;
    }

    // Text-only message
    return sendTextMessage(message);
  } catch (error) {
    console.error(`❌ Telegram publish error: ${error}`);
    return false;
  }
}

async function sendTextMessage(text: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: false },
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error(`❌ Telegram sendMessage error: ${data.description}`);
    return false;
  }

  console.log(`✅ Telegram: published — ${text.slice(0, 50)}...`);
  return true;
}
