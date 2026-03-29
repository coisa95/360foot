import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "360 Foot";
    const type = searchParams.get("type") || "result";
    const league = searchParams.get("league") || "";
    const homeLogo = searchParams.get("homeLogo") || "";
    const awayLogo = searchParams.get("awayLogo") || "";

    const typeLabel =
      type === "preview"
        ? "Avant-Match"
        : type === "transfer"
          ? "Transfert"
          : type === "trending"
            ? "Actualité"
            : "Résultat";

    const accentColor = "#84cc16"; // lime-500
    const hasLogos = homeLogo && awayLogo;

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
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background gradient effects */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(132,204,22,0.15), transparent)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "250px",
              height: "250px",
              background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent)",
              borderRadius: "50%",
            }}
          />

          {/* Top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
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
                  fontSize: "20px",
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

          {/* Main content area */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              gap: "40px",
            }}
          >
            {/* Title */}
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  fontSize: hasLogos
                    ? title.length > 60 ? "36px" : "44px"
                    : title.length > 60 ? "42px" : "56px",
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

            {/* Team logos — VS layout */}
            {hasLogos && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={homeLogo}
                  alt="Home"
                  width={80}
                  height={80}
                  style={{ width: "80px", height: "80px", objectFit: "contain" }}
                />
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#64748b",
                  }}
                >
                  VS
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={awayLogo}
                  alt="Away"
                  width={80}
                  height={80}
                  style={{ width: "80px", height: "80px", objectFit: "contain" }}
                />
              </div>
            )}
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
              360-foot.com
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
