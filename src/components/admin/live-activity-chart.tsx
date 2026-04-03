"use client";

import { Activity, Dot, RefreshCcw } from "lucide-react";
import { formatOrderCurrency } from "@/lib/orders";

export type LiveActivityPoint = {
  label: string;
  orders: number;
  revenue: number;
  messages: number;
};

type Props = {
  points: LiveActivityPoint[];
  isRefreshing: boolean;
  lastUpdatedLabel: string;
};

const SVG_WIDTH = 720;
const SVG_HEIGHT = 260;
const PADDING_X = 24;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 32;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function createRevenuePath(points: LiveActivityPoint[]) {
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const stepX =
    points.length > 1
      ? (SVG_WIDTH - PADDING_X * 2) / (points.length - 1)
      : SVG_WIDTH - PADDING_X * 2;

  const coordinates = points.map((point, index) => {
    const x = PADDING_X + stepX * index;
    const y =
      PADDING_TOP +
      CHART_HEIGHT -
      (point.revenue / maxRevenue) * (CHART_HEIGHT - 16);

    return { x, y };
  });

  const line = coordinates
    .map((coordinate, index) =>
      `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`
    )
    .join(" ");

  const area = `${line} L ${coordinates[coordinates.length - 1]?.x ?? PADDING_X} ${
    SVG_HEIGHT - PADDING_BOTTOM
  } L ${coordinates[0]?.x ?? PADDING_X} ${SVG_HEIGHT - PADDING_BOTTOM} Z`;

  return { coordinates, line, area };
}

export function LiveActivityChart({
  points,
  isRefreshing,
  lastUpdatedLabel,
}: Props) {
  const maxOrders = Math.max(...points.map((point) => point.orders), 1);
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const maxMessages = Math.max(...points.map((point) => point.messages), 1);
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0);
  const totalMessages = points.reduce((sum, point) => sum + point.messages, 0);
  const stepX =
    points.length > 1
      ? (SVG_WIDTH - PADDING_X * 2) / (points.length - 1)
      : SVG_WIDTH - PADDING_X * 2;
  const revenuePath = createRevenuePath(points);

  return (
    <div className="surface-panel overflow-hidden rounded-[2.2rem] border border-[#ead7c3] bg-gradient-to-br from-white via-white to-[#fdf3e6] p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
            <Activity className="h-3.5 w-3.5" strokeWidth={2.2} />
            Live chart
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-900">
            Aktivitas order dan revenue 7 hari terakhir
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Grafik ini membaca order harian, revenue lunas, dan intensitas pesan
            masuk untuk memberi gambaran ritme operasional dapur.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-[#ead7c3] bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <RefreshCcw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-orange-600" : "text-slate-400"}`}
            strokeWidth={2.2}
          />
          {isRefreshing ? "Menyegarkan data" : `Tersinkron ${lastUpdatedLabel}`}
        </div>
      </div>

      <div className="mt-8 rounded-[1.8rem] border border-[#f0dfcb] bg-[#fffaf4] p-5">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-[280px] w-full"
          role="img"
          aria-label="Grafik aktivitas order dan revenue"
        >
          {[0, 1, 2, 3].map((lineIndex) => {
            const y = PADDING_TOP + (CHART_HEIGHT / 3) * lineIndex;

            return (
              <line
                key={lineIndex}
                x1={PADDING_X}
                x2={SVG_WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="#eadcca"
                strokeDasharray="4 8"
              />
            );
          })}

          <path
            d={revenuePath.area}
            fill="url(#revenueFill)"
            opacity="0.9"
          />
          <path
            d={revenuePath.line}
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = PADDING_X + stepX * index;
            const barWidth = 28;
            const barHeight =
              (point.orders / maxOrders) * (CHART_HEIGHT * 0.72);
            const barY = SVG_HEIGHT - PADDING_BOTTOM - barHeight;
            const dotY =
              PADDING_TOP +
              CHART_HEIGHT -
              (point.messages / maxMessages) * (CHART_HEIGHT - 22);

            return (
              <g key={point.label}>
                <rect
                  x={x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, point.orders > 0 ? 10 : 2)}
                  rx="12"
                  fill="#1e293b"
                  opacity="0.14"
                />
                <circle cx={x} cy={dotY} r="6" fill="#10b981" />
                <text
                  x={x}
                  y={SVG_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px] font-semibold uppercase tracking-[0.2em]"
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fdba74" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#fdba74" stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-[#ead7c3] bg-white/85 p-4">
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Dot className="h-4 w-4 text-slate-900" />
            Order baru
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalOrders}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Puncak harian {maxOrders} order.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[#ead7c3] bg-white/85 p-4">
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Dot className="h-4 w-4 text-orange-500" />
            Revenue lunas
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {formatOrderCurrency(totalRevenue)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Puncak nilai harian {formatOrderCurrency(maxRevenue)}.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[#ead7c3] bg-white/85 p-4">
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Dot className="h-4 w-4 text-emerald-500" />
            Pesan masuk
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalMessages}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Puncak pesan harian {maxMessages} pesan.
          </p>
        </div>
      </div>
    </div>
  );
}
