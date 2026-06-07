import { ImageResponse } from "next/og";

export const alt = "Poker Home Tracker — las cuentas de vuestras partidas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPADE =
  "M12 2C12 2 4 8 4 14a4 4 0 0 0 6.6 3.05C10.4 19 9.5 20.3 8 21h8c-1.5-.7-2.4-2-2.6-3.95A4 4 0 0 0 20 14c0-6-8-12-8-12z";
const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "linear-gradient(135deg, #ffffff 0%, #f1f1f1 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Palos decorativos (SVG) */}
        <svg
          width="360"
          height="360"
          viewBox="0 0 24 24"
          fill="rgba(10,10,10,0.05)"
          style={{ position: "absolute", top: -50, right: 50 }}
        >
          <path d={SPADE} />
        </svg>
        <svg
          width="300"
          height="300"
          viewBox="0 0 24 24"
          fill="rgba(220,38,38,0.07)"
          style={{ position: "absolute", bottom: -70, left: 30 }}
        >
          <path d={HEART} />
        </svg>

        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              background: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="62" height="62" viewBox="0 0 24 24" fill="#ffffff">
              <path d={SPADE} />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#525252",
            }}
          >
            POKER HOME TRACKER
          </div>
        </div>

        {/* Claim */}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#0a0a0a",
            maxWidth: 940,
          }}
        >
          Las cuentas de vuestras partidas, sin discusiones.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 36,
            color: "#737373",
          }}
        >
          Buy-ins · quién paga a quién · ranking del grupo
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 30,
            fontWeight: 600,
            color: "#0a0a0a",
          }}
        >
          poker-tracker-lemon.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
