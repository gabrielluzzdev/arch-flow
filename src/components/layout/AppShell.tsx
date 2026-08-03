import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Settings,
  Search,
  Plus,
} from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";

export const NAV = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/propostas", label: "Propostas", icon: FileText },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="px-6 py-7">
        <p className="font-display text-xl leading-none text-foreground">Luz Botelho</p>
        <p className="label-caps mt-2">Arquitetura</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground data-[status=active]:font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-lg border border-border p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm text-accent-foreground">
          LB
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">Luz Botelho</p>
          <p className="truncate text-xs text-muted-foreground">Arquiteta responsável</p>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground transition-colors data-[status=active]:text-primary"
        >
          <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="truncate px-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <p className="font-display text-lg leading-none text-foreground lg:hidden">LB</p>
              <h1 className="truncate text-base font-medium text-foreground sm:text-lg">{title}</h1>
              <div className="relative hidden min-w-0 flex-1 md:block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <input
                  aria-label="Busca global"
                  placeholder="Buscar clientes, lançamentos, propostas"
                  className="h-9 w-full max-w-sm rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-editable"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action}
              <button
                aria-label="Notificações"
                className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm text-accent-foreground">
                LB
              </span>
            </div>
          </div>
        </header>
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12"
        >
          {children}
        </motion.main>
      </div>
      <MobileNav />
    </div>
  );
}

export function NovoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button onClick={onClick} className={cn("shrink-0")}>
      <Plus className="h-4 w-4" strokeWidth={1.75} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}