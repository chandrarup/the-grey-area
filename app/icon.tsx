import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Logo B favicon — quartered square, one amber quadrant. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#12171F",
          border: "1.5px solid #EAE5DA",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
          <div style={{ display: "flex", flex: 1 }}>
            <div
              style={{
                flex: 1,
                borderRight: "1px solid #EAE5DA",
                borderBottom: "1px solid #EAE5DA",
              }}
            />
            <div style={{ flex: 1, borderBottom: "1px solid #EAE5DA" }} />
          </div>
          <div style={{ display: "flex", flex: 1 }}>
            <div
              style={{
                flex: 1,
                background: "#C9822F",
                borderRight: "1px solid #EAE5DA",
              }}
            />
            <div style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
