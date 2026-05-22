"use client";

import React, { useMemo } from "react";

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  slices: PieSlice[];
  size?: number;
  innerRadius?: number; // 0 = full pie, >0 = donut
  className?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function PieChart({ slices, size = 160, innerRadius = 45, className }: PieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;

  const total = slices.reduce((s, sl) => s + sl.value, 0);

  const arcs = useMemo(() => {
    if (total === 0) return [];
    let start = 0;
    return slices.map((sl) => {
      const pct   = sl.value / total;
      const sweep = pct * 360;
      const end   = start + sweep;
      const arc   = describeArc(cx, cy, outerR, start, end);
      const mid   = start + sweep / 2;
      const labelR = outerR * 0.62 + innerRadius * 0.38;
      const labelPt = polarToCartesian(cx, cy, labelR, mid);
      const result = { ...sl, arc, start, end, pct, labelPt };
      start = end;
      return result;
    });
  }, [slices, total, cx, cy, outerR, innerRadius]);

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className}>
        <circle cx={cx} cy={cy} r={outerR} fill="hsl(var(--muted))" opacity={0.4} />
        {innerRadius > 0 && (
          <circle cx={cx} cy={cy} r={innerRadius} fill="hsl(var(--card))" />
        )}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
          Kosong
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className}>
      {arcs.map((a, i) => {
        const isAlmost360 = a.pct > 0.999;
        return (
          <g key={i}>
            {isAlmost360 ? (
              <circle cx={cx} cy={cy} r={outerR} fill={a.color} />
            ) : (
              <path
                d={`${a.arc} L ${cx} ${cy} Z`}
                fill={a.color}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            )}
            {a.pct > 0.07 && (
              <text
                x={a.labelPt.x}
                y={a.labelPt.y + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="700"
                fill="white"
                style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              >
                {Math.round(a.pct * 100)}%
              </text>
            )}
          </g>
        );
      })}
      {innerRadius > 0 && (
        <circle cx={cx} cy={cy} r={innerRadius} fill="hsl(var(--card))" />
      )}
    </svg>
  );
}