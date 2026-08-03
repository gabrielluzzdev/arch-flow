import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Database,
  Eraser,
  LayoutDashboard,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import {
  Card,
  CountUp,
  EmptyState,
  Money,
  SectionTitle,
  Stagger,
  StaggerItem,
  StatusPill,
} from "@/components/common/primitives";
import { FluxoChart, ReceitaPorTipo } from "@/components/dashboard/Charts";
import { clienteTotais, parcelaStatus, resumoMensal } from "@/lib/calc";
import { brl, formatDate, num, todayISO } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — Luz Botelho Arquitetura" },
      {
        name: "description",
        content:
          "Painel com saldo em caixa, contas a receber e a pagar, fluxo de caixa e funil de clientes do escritório.",
      },
      { property: "og:title", content: "Visão Geral — Luz Botelho Arquitetura" },
      {
        property: "og:description",
        content: "Indicadores financeiros e comerciais do escritório em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

type Periodo = "mes" | "trimestre" | "ano";
type Escopo = "Empresa" | "Pessoal" | "Ambos";

function Dashboard() {
  const state = useApp();
  const dispatch = useDispatch();
  const [periodo, setPeriodo] = useState<Periodo>("ano");
  const [escopo, setEscopo] = useState<Escopo>("Ambos");

  const mesAtual = new Date().getMonth() + 1;
  const meses = useMemo(() => {
    if (periodo === "mes") return [mesAtual];
    if (periodo === "trimestre") {
      const inicio = Math.floor((mesAtual - 1) / 3) * 3 + 1;
      return [inicio, inicio + 1, inicio + 2];
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [periodo, mesAtual]);

  const lancFiltrados = state.lancamentos.filter(
    (l) =>
      Number(l.data.slice(0, 4)) === state.ano &&
      meses.includes(Number(l.data.slice(5, 7))) &&
      (escopo === "Ambos" || l.pe === escopo),
  );

  const entradas = lancFiltrados.reduce((a, l) => a + l.entrada, 0);
  const saidas = lancFiltrados.reduce((a, l) => a + l.saida, 0);
  const saldoCaixa = state.saldoInicial + entradas - saidas;

  const parcelas = state.parcelas.map((p) => ({ ...p, status: parcelaStatus(p) }));
  const aReceber = parcelas
    .filter((p) => p.status !== "Pago")
    .reduce((a, p) => a + (p.valor - (p.valorPago ?? 0)), 0);
  const aPagar =
    state.repasses.filter((r) => !r.dataPagamento).reduce((a, r) => a + r.valor, 0) +
    state.contasFixas.reduce((a, c) => a + (c.meses[mesAtual - 1] ?? 0), 0);
  const recebidoNoMes = state.lancamentos
    .filter(
      (l) =>
        Number(l.data.slice(5, 7)) === mesAtual &&
        Number(l.data.slice(0, 4)) === state.ano &&
        !!l.clienteId,
    )
    .reduce((a, l) => a + l.entrada, 0);
  const recebidoMesAnterior = state.lancamentos
    .filter(
      (l) =>
        Number(l.data.slice(5, 7)) === mesAtual - 1 &&
        Number(l.data.slice(0, 4)) === state.ano &&
        !!l.clienteId,
    )
    .reduce((a, l) => a + l.entrada, 0);
  const variacao =
    recebidoMesAnterior > 0 ? (recebidoNoMes - recebidoMesAnterior) / recebidoMesAnterior : 0;

  const projetosAtivos = state.clientes.filter((c) => c.etapa === "Contrato ativo");
  const leads = state.clientes.filter((c) => ["Lead", "Em contato", "Proposta enviada"].includes(c.etapa));

  const resumo = resumoMensal(state).filter((r) => meses.includes(r.mes));

  const receitaPorTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    state.clientes.forEach((c) => {
      const t = clienteTotais(state, c.id).totalPago;
      if (t > 0) mapa.set(c.tipoProjeto, (mapa.get(c.tipoProjeto) ?? 0) + t);
    });
    return [...mapa.entries()]
      .map(([tipo, valor]) => ({ tipo, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [state]);

  const funil = state.listas.etapas.map((etapa) => ({
    etapa,
    qtd: state.clientes.filter((c) => c.etapa === etapa).length,
    valor: state.clientes
      .filter((c) => c.etapa === etapa)
      .reduce((a, c) => a + clienteTotais(state, c.id).total, 0),
  }));
  const maxFunil = Math.max(1, ...funil.map((f) => f.qtd));

  const vencimentos = [
    ...parcelas
      .filter((p) => p.status !== "Pago")
      .map((p) => ({
        id: p.id,
        tipo: "Receber" as const,
        data: p.vencimento,
        descricao: `${state.clientes.find((c) => c.id === p.clienteId)?.nome ?? "Cliente"} — parcela ${p.parcela}`,
        valor: p.valor,
        status: p.status,
      })),
    ...state.repasses
      .filter((r) => !r.dataPagamento)
      .map((r) => ({
        id: r.id,
        tipo: "Pagar" as const,
        data: r.marco,
        descricao: `Repasse — ${state.engenheiros.find((e) => e.id === r.engenheiroId)?.nome ?? "Engenharia"}`,
        valor: r.valor,
        status: "Pendente",
      })),
  ].slice(0, 6);

  const vazio = state.clientes.length === 0 && state.lancamentos.length === 0;

  const kpis = [
    { label: "Saldo em caixa", value: saldoCaixa, hint: `Saldo inicial ${brl(state.saldoInicial)}` },
    { label: "A receber", value: aReceber, hint: `${parcelas.filter((p) => p.status !== "Pago").length} parcelas em aberto` },
    { label: "A pagar", value: aPagar, hint: "Repasses + contas fixas do mês" },
    {
      label: "Recebido no mês",
      value: recebidoNoMes,
      hint: variacao ? `${variacao > 0 ? "+" : ""}${num(variacao * 100, 1)}% vs. mês anterior` : "Sem base anterior",
      variacao,
    },
  ];

  return (
    <AppShell
      title="Visão Geral"
      action={
        state.clientes.length === 0 ? (
          <Button size="sm" onClick={() => dispatch({ type: "seed" })}>
            <Database className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Carregar dados de exemplo</span>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "reset" })}>
            <Eraser className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Limpar dados</span>
          </Button>
        )
      }
    >
      {vazio ? (
        <Card>
          <EmptyState
            icon={LayoutDashboard}
            title="Nenhum dado por aqui ainda"
            description="Cadastre clientes e lançamentos, ou carregue dados de exemplo para visualizar o painel completo."
            action={
              <div className="flex gap-2">
                <Button onClick={() => dispatch({ type: "seed" })}>Carregar dados de exemplo</Button>
                <Link to="/clientes">
                  <Button variant="outline">Novo cliente</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Stagger className="space-y-6">
          <StaggerItem className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card p-1">
              {(["mes", "trimestre", "ano"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${periodo === p ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p === "mes" ? "Mês" : p === "trimestre" ? "Trimestre" : "Ano"}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border bg-card p-1">
              {(["Empresa", "Pessoal", "Ambos"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEscopo(e)}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${escopo === e ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label}>
                <p className="label-caps">{k.label}</p>
                <p className="mt-3 text-2xl text-foreground">
                  <CountUp value={k.value} />
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  {k.variacao !== undefined && k.variacao !== 0 ? (
                    k.variacao > 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-positive" strokeWidth={1.5} />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-negative" strokeWidth={1.5} />
                    )
                  ) : null}
                  {k.hint}
                </p>
              </Card>
            ))}
          </StaggerItem>

          <StaggerItem className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="label-caps">Projetos ativos</p>
              <p className="mt-3 text-2xl text-foreground num">{projetosAtivos.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Contratos em execução no escritório
              </p>
            </Card>
            <Card>
              <p className="label-caps">Leads no funil</p>
              <p className="mt-3 text-2xl text-foreground num">{leads.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {brl(leads.reduce((a, c) => a + clienteTotais(state, c.id).total, 0))} em potencial
              </p>
            </Card>
          </StaggerItem>

          <StaggerItem className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <SectionTitle title="Fluxo de caixa" description={`Ano ${state.ano}`} />
              <FluxoChart data={resumo} />
            </Card>
            <Card>
              <SectionTitle title="Receita por tipo de projeto" />
              {receitaPorTipo.length ? (
                <ReceitaPorTipo data={receitaPorTipo} />
              ) : (
                <EmptyState icon={CalendarClock} title="Sem receita registrada" />
              )}
            </Card>
          </StaggerItem>

          <StaggerItem className="grid gap-4 xl:grid-cols-3">
            <Card>
              <SectionTitle title="Funil comercial" />
              <ul className="space-y-3">
                {funil.map((f) => (
                  <li key={f.etapa}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{f.etapa}</span>
                      <span className="num text-muted-foreground">{f.qtd}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${(f.qtd / maxFunil) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <SectionTitle title="Próximos vencimentos" />
              {vencimentos.length ? (
                <ul className="divide-y divide-border">
                  {vencimentos.map((v) => (
                    <li key={`${v.tipo}-${v.id}`} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{v.descricao}</p>
                        <p className="num mt-0.5 text-xs text-muted-foreground">
                          {v.tipo === "Receber" ? formatDate(v.data) : v.data}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Money value={v.valor} tone={v.tipo === "Receber" ? "positive" : "negative"} className="text-sm" />
                        <div className="mt-1 flex items-center justify-end gap-2">
                          <StatusPill status={v.status} />
                          <button
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() =>
                              v.tipo === "Receber"
                                ? dispatch({
                                    type: "update",
                                    entidade: "parcelas",
                                    id: v.id,
                                    patch: { dataPagamento: todayISO(), valorPago: v.valor },
                                  })
                                : dispatch({
                                    type: "update",
                                    entidade: "repasses",
                                    id: v.id,
                                    patch: { dataPagamento: todayISO() },
                                  })
                            }
                          >
                            Marcar pago
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={CalendarClock} title="Nada vencendo agora" />
              )}
            </Card>

            <Card>
              <SectionTitle title="Projetos em andamento" />
              {projetosAtivos.length ? (
                <ul className="divide-y divide-border">
                  {projetosAtivos.map((c) => {
                    const t = clienteTotais(state, c.id);
                    return (
                      <li key={c.id} className="py-3">
                        <Link
                          to="/clientes/$clienteId"
                          params={{ clienteId: c.id }}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">{c.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.tipoProjeto}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <Money value={t.saldo} className="text-sm" />
                            <p className="label-caps mt-0.5">a receber</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={CalendarClock} title="Nenhum contrato ativo" />
              )}
            </Card>
          </StaggerItem>
        </Stagger>
      )}
    </AppShell>
  );
}
