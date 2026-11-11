import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AquaPure — Premium Su Arıtma Sistemleri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0284C7 0%, #075985 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          💧
        </div>
        AquaPure
      </div>
      <div style={{ fontSize: 72, fontWeight: 800, marginTop: 40, lineHeight: 1.1 }}>
        Musluğunuzdan berrak bir gelecek akıyor.
      </div>
      <div style={{ fontSize: 32, marginTop: 28, opacity: 0.85 }}>
        Cihaz seçici · Ücretsiz kurulum · 6 aylık filtre aboneliği
      </div>
    </div>,
    size,
  );
}
