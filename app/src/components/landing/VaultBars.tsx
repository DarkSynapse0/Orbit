"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Monthly vault balance, trending up — the shadcn "bar chart with a label".
const chartData = [
  { month: "January", balance: 120 },
  { month: "February", balance: 162 },
  { month: "March", balance: 198 },
  { month: "April", balance: 255 },
  { month: "May", balance: 312 },
  { month: "June", balance: 420 },
];

const chartConfig = {
  balance: {
    label: "Vault",
    color: "var(--foreground)",
  },
} satisfies ChartConfig;

export function VaultBars() {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="balance" fill="var(--color-balance)" radius={8}>
          <LabelList position="top" offset={12} className="fill-[var(--foreground)]" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
