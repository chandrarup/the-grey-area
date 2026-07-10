import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#25384d",
          color: "#faf9f7",
          fontSize: 20,
          fontFamily: "serif",
          fontWeight: 600,
        }}
      >
        W
      </div>
    ),
    { ...size },
  );
}
