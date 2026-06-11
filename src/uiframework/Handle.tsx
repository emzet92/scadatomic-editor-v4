export function Handle({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - 5,
        top: y - 5,
        width: 10,
        height: 10,
        background: "#00aaff",
        border: "1px solid white",
        borderRadius: "50%",
        zIndex: 10000,
      }}
    />
  );
}