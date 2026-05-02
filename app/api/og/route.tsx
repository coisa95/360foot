import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// 360 Foot brand colors (emerald — matches site CSS --primary 160 84% 39%)
const BRAND_GREEN = "#10b981";
const BRAND_GREEN_DARK = "#059669";
const NAVY_DEEP = "#0f172a";
const NAVY_SOFT = "#1e293b";
const SLATE_TEXT = "#94a3b8";

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
    // Optional match metadata
    const scoreHome = searchParams.get("scoreHome") || "";
    const scoreAway = searchParams.get("scoreAway") || "";
    const dateLabel = searchParams.get("date") || ""; // e.g. "Sam. 3 mai · 18:00"
    const status = searchParams.get("status") || ""; // "LIVE" | "FT" | "NS" | ""

    const hasLogos = !!(homeLogo && awayLogo);
    const hasScore = scoreHome !== "" && scoreAway !== "";

    // Match articles with team logos → premium diagonal VS layout
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
              // Deep emerald → navy gradient
              backgroundImage:
                "linear-gradient(135deg, #064e3b 0%, #0f172a 60%, #1e293b 100%)",
            }}
          >
            {/* Diagonal accent shape — emerald glow, very subtle */}
            <div
              style={{
                position: "absolute",
                top: "-250px",
                right: "-250px",
                width: "900px",
                height: "900px",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.18), transparent 70%)",
                borderRadius: "50%",
                display: "flex",
              }}
            />

            {/* Light geometric panel — subtle, top-right diagonal */}
            <div
              style={{
                position: "absolute",
                top: "-200px",
                right: "-300px",
                width: "1100px",
                height: "1100px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(16,185,129,0.06))",
                transform: "rotate(28deg)",
                transformOrigin: "center center",
                display: "flex",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            />

            {/* Decorative diagonal lines for texture */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 60px)",
                display: "flex",
              }}
            />

            {/* Home team logo — left side, bigger with shadow */}
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
                width={280}
                height={280}
                style={{
                  width: "280px",
                  height: "280px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
                }}
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
                width={280}
                height={280}
                style={{
                  width: "280px",
                  height: "280px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
                }}
              />
            </div>

            {/* CENTER — score if FT, "VS" otherwise */}
            {hasScore ? (
              <div
                style={{
                  position: "absolute",
                  top: "230px",
                  left: "440px",
                  width: "320px",
                  height: "170px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "30px",
                }}
              >
                <span
                  style={{
                    fontSize: "120px",
                    fontWeight: 900,
                    color: "#ffffff",
                    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    display: "flex",
                  }}
                >
                  {scoreHome}
                </span>
                <span
                  style={{
                    fontSize: "60px",
                    fontWeight: 700,
                    color: BRAND_GREEN,
                    display: "flex",
                  }}
                >
                  -
                </span>
                <span
                  style={{
                    fontSize: "120px",
                    fontWeight: 900,
                    color: "#ffffff",
                    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    display: "flex",
                  }}
                >
                  {scoreAway}
                </span>
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: "235px",
                  left: "540px",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  boxShadow:
                    "0 0 0 6px rgba(16,185,129,0.25), 0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <span
                  style={{
                    fontSize: "44px",
                    fontWeight: 900,
                    color: NAVY_DEEP,
                    letterSpacing: "-1px",
                  }}
                >
                  VS
                </span>
              </div>
            )}

            {/* Status badge under score/VS — LIVE pulse, FT, kickoff time */}
            {status && (
              <div
                style={{
                  position: "absolute",
                  top: hasScore ? "415px" : "375px",
                  left: "0",
                  right: "0",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      status === "LIVE"
                        ? "#ef4444"
                        : status === "FT"
                          ? NAVY_SOFT
                          : BRAND_GREEN_DARK,
                    color: "#ffffff",
                    padding: "8px 22px",
                    borderRadius: "999px",
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  {status === "LIVE" && (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        display: "flex",
                      }}
                    />
                  )}
                  {status}
                </div>
              </div>
            )}

            {/* League pill — bottom center, premium glassy */}
            {league && (
              <div
                style={{
                  position: "absolute",
                  bottom: "32px",
                  left: "0",
                  right: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    backdropFilter: "blur(8px)",
                    padding: "12px 32px",
                    borderRadius: "999px",
                    border: "1px solid rgba(16,185,129,0.3)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  {leagueLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={leagueLogo}
                      alt=""
                      width={28}
                      height={28}
                      style={{
                        width: "28px",
                        height: "28px",
                        objectFit: "contain",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {league}
                  </span>
                </div>
              </div>
            )}

            {/* 360 Foot branding — top left, emerald accent */}
            <div
              style={{
                position: "absolute",
                top: "28px",
                left: "32px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_GREEN_DARK})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
                  letterSpacing: "-0.5px",
                }}
              >
                360
              </div>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                }}
              >
                360 Foot
              </span>
            </div>

            {/* Date label — top right (optional) */}
            {dateLabel && (
              <div
                style={{
                  position: "absolute",
                  top: "32px",
                  right: "32px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(15,23,42,0.6)",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: SLATE_TEXT,
                    letterSpacing: "0.5px",
                  }}
                >
                  {dateLabel}
                </span>
              </div>
            )}
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    // Non-match articles (transfers, news, profiles) → title-based premium layout
    const typeLabel =
      type === "preview"
        ? "Avant-Match"
        : type === "transfer"
          ? "Transfert"
          : type === "trending"
            ? "Actualité"
            : type === "streaming"
              ? "Streaming"
              : type === "player_profile"
                ? "Profil joueur"
                : type === "recap"
                  ? "Résumé match"
                  : "Résultat";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            // Deep emerald → navy gradient (same as match layout)
            backgroundImage:
              "linear-gradient(135deg, #064e3b 0%, #0f172a 60%, #1e293b 100%)",
            padding: "60px",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle diagonal texture lines */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 60px)",
              display: "flex",
            }}
          />

          {/* Emerald glow — top right */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              right: "-150px",
              width: "550px",
              height: "550px",
              background:
                "radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          {/* Cool secondary glow — bottom left */}
          <div
            style={{
              position: "absolute",
              bottom: "-120px",
              left: "-120px",
              width: "400px",
              height: "400px",
              background:
                "radial-gradient(circle, rgba(8,145,178,0.22), transparent 70%)",
              borderRadius: "50%",
              display: "flex",
            }}
          />

          {/* Top bar — brand + type pill */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
              zIndex: 1,
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
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_GREEN_DARK})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.45)",
                  letterSpacing: "-0.5px",
                }}
              >
                360
              </div>
              <span
                style={{
                  fontSize: "34px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                }}
              >
                360 Foot
              </span>
            </div>
            <div
              style={{
                background: `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_GREEN_DARK})`,
                color: "#ffffff",
                padding: "10px 24px",
                borderRadius: "999px",
                fontSize: "18px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                boxShadow: "0 4px 16px rgba(16,185,129,0.4)",
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
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: title.length > 80 ? "40px" : title.length > 50 ? "52px" : "62px",
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-1px",
                textShadow: "0 4px 24px rgba(0,0,0,0.4)",
                display: "flex",
              }}
            >
              {title}
            </div>
          </div>

          {/* Bottom bar — emerald separator + league + domain */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `2px solid ${BRAND_GREEN}`,
              paddingTop: "20px",
              zIndex: 1,
            }}
          >
            {league ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {leagueLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={leagueLogo}
                    alt=""
                    width={28}
                    height={28}
                    style={{
                      width: "28px",
                      height: "28px",
                      objectFit: "contain",
                    }}
                  />
                )}
                <span style={{ fontSize: "22px", color: SLATE_TEXT, fontWeight: 600, display: "flex" }}>
                  {league}
                </span>
              </div>
            ) : (
              <span />
            )}
            <span style={{ fontSize: "18px", color: "#64748b", fontWeight: 500, display: "flex" }}>
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
