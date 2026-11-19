import { ImageResponse } from "next/og";

export const alt = "Consorcio AI, preanálisis crediticio para analistas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenSocial() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#EEF0F0",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 72,
          height: 72,
          borderRadius: 16,
          background: "#0B0B0C",
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: 600,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        CF
      </div>
      <div style={{ marginTop: 32, fontSize: 64, color: "#0B0B0C", fontWeight: 600 }}>
        Preanálisis crediticio
      </div>
      <div style={{ marginTop: 16, fontSize: 28, color: "#6B7280" }}>
        La IA recomienda. El analista decide.
      </div>
    </div>,
    { ...size },
  );
}
