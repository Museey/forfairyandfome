"use client";

// Last-resort boundary for errors thrown in the root layout itself. It
// replaces the whole document, so it has to render <html>/<body> and can't
// rely on the app's stylesheet being applied.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#c1e1f0",
          color: "#3d2b2e",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            มีบางอย่างผิดพลาด
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#8a7679" }}>
            ลองใหม่อีกครั้ง ถ้ายังไม่หายให้ปิดแอปแล้วเปิดใหม่
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "none",
            borderRadius: 16,
            background: "#852936",
            color: "#faf7ea",
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ลองใหม่
        </button>
      </body>
    </html>
  );
}
