import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Penny — your money, spoken plainly"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          color: "#171717",
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        Penny
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            fontWeight: 400,
            color: "#525252",
          }}
        >
          Your money, spoken plainly
        </div>
      </div>
    ),
    { ...size }
  )
}
