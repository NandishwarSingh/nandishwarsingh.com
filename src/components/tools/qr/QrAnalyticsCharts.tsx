"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const DEVICE_COLORS = ["#7A9FD8", "#CADCFC", "#E7B2C9", "#F2C67A", "#C8A6F2", "#8FD3B5"]

type TimeseriesPoint = { day: string; clicks: number }
type CountryPoint = { country: string; clicks: number }
type DevicePoint = { device: string; clicks: number }

export function ClicksTimeseries({ data }: { data: TimeseriesPoint[] }) {
  const padded = fillGaps(data)
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={padded} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="day"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickFormatter={(v) => (v as string).slice(5)}
        />
        <YAxis
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          contentStyle={{
            background: "rgba(10,10,10,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#fafafa" }}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="#CADCFC"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CountryBar({ data }: { data: CountryPoint[] }) {
  if (!data.length) {
    return <EmptyChartMsg>No country data yet</EmptyChartMsg>
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 22)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="country"
          stroke="#a1a1aa"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "rgba(10,10,10,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#fafafa" }}
        />
        <Bar dataKey="clicks" fill="#7A9FD8" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DeviceDonut({ data }: { data: DevicePoint[] }) {
  if (!data.length) {
    return <EmptyChartMsg>No device data yet</EmptyChartMsg>
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: "rgba(10,10,10,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Pie
          data={data}
          dataKey="clicks"
          nameKey="device"
          innerRadius={48}
          outerRadius={78}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

function EmptyChartMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">
      {children}
    </div>
  )
}

function fillGaps(series: TimeseriesPoint[]): TimeseriesPoint[] {
  if (series.length === 0) return []
  const byDay = new Map(series.map((p) => [p.day, p.clicks]))
  const out: TimeseriesPoint[] = []
  const start = new Date(series[0]!.day)
  const end = new Date(series[series.length - 1]!.day)
  const cursor = new Date(start)
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    out.push({ day: key, clicks: byDay.get(key) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
