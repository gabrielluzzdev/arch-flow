import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { brl } from "@/lib/format";

const axis = {
  stroke: "var(--color-border)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

export function FluxoChart({
  data,
}: {
  data: { label: string; entradas: number; saidas: number; acumulado: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="2 4" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={64} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <Tooltip formatter={(v) => brl(Number(v))} {...tooltipStyle} />
        <Bar dataKey="entradas" name="Entradas" fill="var(--color-positive)" radius={[3, 3, 0, 0]} barSize={10} />
        <Bar dataKey="saidas" name="Saídas" fill="var(--color-negative)" radius={[3, 3, 0, 0]} barSize={10} />
        <Line
          type="monotone"
          dataKey="acumulado"
          name="Caixa acumulado"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ReceitaPorTipo({ data }: { data: { tipo: string; valor: number }[] }) {
  const cores = [
    "var(--color-primary)",
    "var(--color-positive)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="tipo" width={140} {...axis} />
        <Tooltip formatter={(v) => brl(Number(v))} {...tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((_, i) => (
            <Cell key={i} fill={cores[i % cores.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SaldoArea({ data }: { data: { label: string; acumulado: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" {...axis} />
        <Tooltip formatter={(v) => brl(Number(v))} {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="acumulado"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          fill="url(#saldoFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}