export const brl = (v: number | undefined | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

export const num = (v: number | undefined | null, digits = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v ?? 0);

export const pct = (v: number) => `${num(v * 100, 1)}%`;

export const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

export const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const mesDaData = (iso?: string) => {
  if (!iso) return "—";
  const m = Number(iso.slice(5, 7));
  return MESES[m - 1] ?? "—";
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const uid = () => Math.random().toString(36).slice(2, 10);

export const tamanhoLegivel = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};