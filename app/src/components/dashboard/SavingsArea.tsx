"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Interactive gradient area chart of cumulative savings over time (shadcn area chart).
const chartConfig = {
  saved: { label: "Saved", color: "var(--accent)" },
} satisfies ChartConfig;

export function SavingsArea({ data }: { data: { date: string; saved: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillSaved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-saved)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-saved)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
              formatter={(v) => `$${Number(v).toFixed(2)}`}
            />
          }
        />
        <Area dataKey="saved" type="natural" fill="url(#fillSaved)" stroke="var(--color-saved)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
}
