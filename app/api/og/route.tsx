import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTitle = searchParams.get("title") || "360 Foot";
    const title = rawTitle.length > 200 ? rawTitle.slice(0, 197) + "..." : rawTitle;
    const type = searchParams.get("type") || "result";
    const rawLeague = searchParams.get("league") || "";
    const league = rawLeague.length > 100 ? rawLeague.slice(0, 97) + "..." : rawLeague;
    const homeLogo = searchParams.get("homeLogo") || "";
    const awayLogo = searchParams.get("awayLogo") || "";
    const leagueLogo = searchParams.get("leagueLogo") || "";

    const hasLogos = !!(homeLogo && awayLogo);

    // Match articles with team logos → diagonal VS layout
    if (hasLogos) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              position: "relative",
              overflow: "hidden",
              fontFamily: "sans-serif",
              backgroundColor: "#0891b2",
            }}
          >
            {/* Right triangle (light) — large rotated box */}
            <div
              style={{
                position: "absolute",
                top: "-300px",
                right: "-200px",
                width: "1200px",
                height: "1200px",
                backgroundColor: "#f0f9ff",
                transform: "rotate(30deg)",
                transformOrigin: "center center",
                display: "flex",
              }}
            />

            {/* Home team logo — left side */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "500px",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={homeLogo}
                alt="Home"
                width={220}
                height={220}
                style={{ width: "220px", height: "220px", objectFit: "contain" }}
              />
            </div>

            {/* Away team logo — right side */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "500px",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={awayLogo}
                alt="Away"
                width={220}
                height={220}
                style={{ width: "220px", height: "220px", objectFit: "contain" }}
              />
            </div>

            {/* VS badge — center */}
            <div
              style={{
                position: "absolute",
                top: "250px",
                left: "555px",
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                border: "3px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                VS
              </span>
            </div>

            {/* League name — bottom center */}
            {league && (
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "400px",
                  width: "400px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  backgroundColor: "rgba(15,23,42,0.85)",
                  padding: "10px 28px",
                  borderRadius: "30px",
                }}
              >
                {leagueLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={leagueLogo}
                    alt=""
                    width={24}
                    height={24}
                    style={{ width: "24px", height: "24px", objectFit: "contain" }}
                  />
                )}
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  {league}
                </span>
              </div>
            )}

            {/* 360 Foot branding — top left */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#84cc16",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                360
              </div>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#ffffff",
                }}
              >
                360 Foot
              </span>
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    // Non-match articles (transfers, news, etc.) → title-based layout
    const typeLabel =
      type === "preview"
        ? "Avant-Match"
        : type === "transfer"
          ? "Transfert"
          : type === "trending"
            ? "Actualité"
            : "Résultat";

    const accentColor = "#84cc16";

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
              background:
                "radial-gradient(circle, rgba(132,204,22,0.15), transparent)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "250px",
              height: "250px",
              background:
                "radial-gradient(circle, rgba(8,145,178,0.15), transparent)",
              borderRadius: "50%",
              display: "flex",
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
                display: "flex",
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
            <div
              style={{
                fontSize: title.length > 60 ? "42px" : "56px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1.2,
                display: "flex",
              }}
            >
              {title}
            </div>
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
              <span style={{ fontSize: "22px", color: "#94a3b8", display: "flex" }}>
                {league}
              </span>
            )}
            <span style={{ fontSize: "18px", color: "#64748b", display: "flex" }}>
              360-foot.com
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
