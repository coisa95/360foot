import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "360 Foot";
    const type = searchParams.get("type") || "result";
    const league = searchParams.get("league") || "";

    const typeLabel =
      type === "preview"
        ? "Avant-Match"
        : type === "transfer"
          ? "Transfert"
          : "Resultat";

    const accentColor = "#84cc16"; // lime-500

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0f172a",
            padding: "60px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                360
              </div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                360 Foot
              </span>
            </div>
            <div
              style={{
                backgroundColor: accentColor,
                color: "#0f172a",
                padding: "8px 20px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {typeLabel}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
            }}
          >
            <h1
              style={{
                fontSize: title.length > 60 ? "42px" : "56px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1.2,
                margin: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `2px solid ${accentColor}`,
              paddingTop: "20px",
            }}
          >
            {league && (
              <span
                style={{
                  fontSize: "22px",
                  color: "#94a3b8",
                }}
              >
                {league}
              </span>
            )}
            <span
              style={{
                fontSize: "18px",
                color: "#64748b",
              }}
            >
              360foot.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
