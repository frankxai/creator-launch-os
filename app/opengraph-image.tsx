import { ImageResponse } from "next/og"

export const alt = "Creator Launch OS by Edition Zero"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f2efe6",
          color: "#11120f",
          display: "flex",
          height: "100%",
          padding: 56,
          width: "100%",
        }}
      >
        <div style={{ border: "2px solid #11120f", display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
          <div style={{ display: "flex", fontSize: 24, justifyContent: "space-between", letterSpacing: 4, textTransform: "uppercase" }}>
            <span>Edition Zero</span>
            <span>Free template · 2026</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 94, fontWeight: 700, letterSpacing: -5, lineHeight: 0.95 }}>Creator Launch OS</span>
            <span style={{ color: "#66685f", fontSize: 32, marginTop: 28 }}>A storefront with an operating room behind it.</span>
          </div>
          <div style={{ alignItems: "center", display: "flex", fontSize: 22, gap: 18 }}>
            <span style={{ background: "#f05a3c", borderRadius: 999, height: 20, width: 20 }} />
            <span>Next.js · Vercel · v0-ready</span>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
