import { ImageResponse } from "next/og";

export const alt = "Poker Home Tracker — las cuentas de vuestras partidas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        {/* Palos decorativos */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: 60,
            fontSize: 320,
            color: "rgba(10,10,10,0.04)",
            display: "flex",
          }}
        >
          ♠
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: 40,
            fontSize: 260,
            color: "rgba(220,38,38,0.06)",
            display: "flex",
          }}
        >
          ♥
        </div>

        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              background: "#0a0a0a",
              color: "#fff",
              fontSize: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ♠
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
            maxWidth: 920,
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
