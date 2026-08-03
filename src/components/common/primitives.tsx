import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/format";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("card-surface p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  description,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("label-caps", className)}>{children}</span>;
}

export function Money({
  value,
  tone = "neutral",
  className,
}: {
  value: number;
  tone?: "neutral" | "positive" | "negative" | "auto";
  className?: string;
}) {
  const resolved =
    tone === "auto" ? (value > 0 ? "positive" : value < 0 ? "negative" : "neutral") : tone;
  return (
    <span
      className={cn(
        "num",
        resolved === "positive" && "text-positive",
        resolved === "negative" && "text-negative",
        className,
      )}
    >
      {brl(value)}
    </span>
  );
}

export function CountUp({ value, format = brl }: { value: number; format?: (n: number) => string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, reduce]);

  return <span className="num">{format(display)}</span>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.25} />
      <p className="mt-4 text-base text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Pago" || status === "Aceita" || status === "Contrato ativo"
      ? "bg-positive/10 text-positive"
      : status === "Vencido" || status === "Recusada" || status === "Perdido"
        ? "bg-negative/10 text-negative"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {status}
    </span>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}