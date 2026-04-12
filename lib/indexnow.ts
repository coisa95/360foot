const HOST = process.env.NEXT_PUBLIC_SITE_URL || "https://360-foot.com";

export async function submitToIndexNow(urls: string[]) {
  if (urls.length === 0) return;

  try {
    await fetch(`${HOST}/api/indexnow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INDEXNOW_SECRET || "360foot-indexnow-2025"}`,
      },
      body: JSON.stringify({ urls }),
    });
  } catch (e) {
    console.error("[IndexNow] Failed to submit URLs:", e);
  }
}
