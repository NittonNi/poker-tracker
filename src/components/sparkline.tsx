/**
 * Mini-gráfico de línea + área, sin dependencias. Pinta la evolución de una
 * serie de valores (p. ej. balance acumulado). Verde si acaba en positivo,
 * rojo si acaba en negativo.
 */
export function Sparkline({
  values,
  width = 132,
  height = 44,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const y = (v: number) => height - ((v - min) / range) * height;
  const pts = values.map((v, i) => [i * stepX, y(v)] as const);

  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const up = values[values.length - 1] >= 0;
  const color = up ? "#059669" : "#dc2626"; // emerald-600 / red-600
  const zeroY = y(0);
  const gid = `spark-${up ? "up" : "down"}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        y1={zeroY}
        x2={width}
        y2={zeroY}
        stroke="#e5e5e5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
