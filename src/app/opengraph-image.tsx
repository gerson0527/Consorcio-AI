import { ImageResponse } from "next/og";

export const alt = "Consorcio AI, preanálisis crediticio para analistas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenSocial() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#F4F5F7",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#1F4FD8",
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: 600,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          CF
        </div>
        <div style={{ marginTop: 32, fontSize: 64, color: "#141B2D", fontWeight: 600 }}>
          Preanálisis crediticio
        </div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#3E4658" }}>
          La IA recomienda. El analista decide.
        </div>
      </div>
    ),
    { ...size },
  );
}
