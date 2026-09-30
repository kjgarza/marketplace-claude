# Chart Patterns — recharts + shadcn/ui

Use `recharts` with shadcn's `ChartContainer` and `ChartTooltip` wrappers. Install:

```bash
bun add recharts
bunx shadcn@latest add chart
```

---

## ChartContainer Setup

`ChartContainer` applies the shadcn chart theme (CSS custom properties for colors) and makes charts responsive via a `ResponsiveContainer` wrapper.

```typescript
// components/charts/sales-chart.tsx
"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;
```

---

## BarChart

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
];

export function RevenueBarChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

---

## LineChart

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
  { date: "2024-01", users: 120 },
  { date: "2024-02", users: 145 },
  { date: "2024-03", users: 180 },
];

export function UsersLineChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="users"
          stroke="var(--color-users)"
          strokeWidth={2}
          dot={false}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
}
```

---

## PieChart

```typescript
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
  { name: "Direct", value: 400 },
  { name: "Organic", value: 300 },
  { name: "Referral", value: 200 },
];

const pieConfig = {
  direct:   { label: "Direct",   color: "hsl(var(--chart-1))" },
  organic:  { label: "Organic",  color: "hsl(var(--chart-2))" },
  referral: { label: "Referral", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function TrafficPieChart() {
  return (
    <ChartContainer config={pieConfig} className="h-[300px] w-full">
      <PieChart accessibilityLayer>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={`hsl(var(--chart-${index + 1}))`}
            />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
```

---

## Axis Formatting

Format axis ticks with a `tickFormatter` prop:

```typescript
// Currency
<YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />

// Compact numbers
<YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />

// Short date
<XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short" })} />
```

---

## Tooltip Customisation

Use `ChartTooltipContent` props:
- `hideLabel` — omit the category label
- `nameKey` — which data key to display as the name
- `indicator="line"` — show color line instead of dot

```typescript
<ChartTooltip content={<ChartTooltipContent hideLabel indicator="line" />} />
```

---

## Dark Mode

`ChartContainer` applies `--chart-1` through `--chart-5` CSS variables that are defined in shadcn's base styles for both light and dark themes. Do not hard-code colors — always use `var(--color-<key>)` from the chart config or `hsl(var(--chart-N))`.

```css
/* shadcn defines these automatically in globals.css */
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}
.dark {
  --chart-1: 220 70% 60%;
  /* ... */
}
```
