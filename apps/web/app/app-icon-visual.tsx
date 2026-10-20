export function AppIconVisual({ size }: Readonly<{ size: number }>) {
  const inset = Math.round(size * 0.11);
  const badgeSize = Math.round(size * 0.54);

  return (
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(145deg, #006d6a 0%, #008f8c 100%)",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#c8102e",
          borderRadius: size,
          height: Math.round(size * 0.055),
          left: inset,
          position: "absolute",
          right: inset,
          top: inset,
        }}
      />
      <div
        style={{
          alignItems: "center",
          background: "#ffffff",
          borderRadius: Math.round(size * 0.18),
          boxShadow: `0 ${Math.round(size * 0.04)}px ${Math.round(size * 0.1)}px rgba(23, 35, 58, 0.22)`,
          color: "#006d6a",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: Math.round(size * 0.37),
          fontWeight: 800,
          height: badgeSize,
          justifyContent: "center",
          lineHeight: 1,
          width: badgeSize,
        }}
      >
        A
      </div>
      <div
        style={{
          bottom: inset,
          color: "#ffffff",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: Math.round(size * 0.055),
          fontWeight: 700,
          letterSpacing: Math.round(size * 0.006),
          position: "absolute",
        }}
      >
        PILOT
      </div>
    </div>
  );
}
