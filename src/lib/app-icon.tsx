export function AppIconGlyph({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#852936",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: size * 0.44,
          fontWeight: 700,
          color: "#faf7ea",
          fontFamily: "sans-serif",
        }}
      >
        FF
      </div>
    </div>
  );
}
