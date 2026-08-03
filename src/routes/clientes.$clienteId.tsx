import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, Money, SectionTitle, StatusPill } from "@/components/common/primitives";
import { Field, SelectInput, TextInput } from "@/components/common/fields";
import { Modal } from "@/components/common/Modal";
import {
  clienteTotais,
  parcelaStatus,
  pixDoEngenheiro,
  rentabilidade,
  repasseStatus,
  servicoTotal,
} from "@/lib/calc";
import { brl, formatDate, num, pct, todayISO, uid } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";

export const Route = createFileRoute("/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Detalhe do cliente — Luz Botelho Arquitetura" },
      { name: "description", content: "Contrato, serviços, parcelas, repasses e rentabilidade do projeto." },
      { property: "og:title", content: "Detalhe do cliente — Luz Botelho Arquitetura" },
      { property: "og:description", content: "Visão completa do contrato e da rentabilidade do projeto." },
    ],
  }),
  component: DetalheCliente,
});

const ABAS = [
  "Resumo",
  "Serviços",
  "Parcelas",
  "Reembolsáveis",
  "Impostos NF",
  "Repasses",
  "Rentabilidade",
  "Notas",
] as const;

function DetalheCliente() {
  const { clienteId } = Route.useParams();
  const state = useApp();
  const dispatch = useDispatch();
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Resumo");
  const [modal, setModal] = useState<"servico" | "parcela" | null>(null);
  const [servico, setServico] = useState({ descricao: "", categoria: "Honorários", area: 0, valorM2: 0 });
  const [parcela, setParcela] = useState({ parcela: "", vencimento: todayISO(), valor: 0 });

  const cliente = state.clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    return (
      <AppShell title="Cliente">
        <Card>
          <EmptyState icon={FileText} title="Cliente não encontrado" action={<Link to="/clientes"><Button variant="outline">Voltar</Button></Link>} />
        </Card>
      </AppShell>
    );
  }

  const t = clienteTotais(state, cliente.id);
  const servicos = state.servicos.filter((s) => s.clienteId === cliente.id);
  const parcelas = state.parcelas.filter((p) => p.clienteId === cliente.id);
  const reembolsaveis = state.reembolsaveis.filter((r) => r.clienteId === cliente.id);
  const impostos = state.impostos.filter((r) => r.clienteId === cliente.id);
  const repasses = state.repasses.filter((r) => r.clienteId === cliente.id);
  const rent = rentabilidade(state).find((r) => r.cliente.id === cliente.id);

  return (
    <AppShell title={cliente.nome}>
      <Link to="/clientes" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Clientes
      </Link>

      <Card className="mb-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="label-caps">{cliente.codigo} · {cliente.tipoProjeto}</p>
            <h2 className="mt-2 truncate text-2xl">{cliente.nome}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{cliente.endereco}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={cliente.etapa} />
              <SelectInput
                className="h-8 w-48 text-xs"
                options={state.listas.etapas}
                value={cliente.etapa}
                onChange={(e) => dispatch({ type: "update", entidade: "clientes", id: cliente.id, patch: { etapa: e.target.value } })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
            {[
              { label: "Total", value: t.total },
              { label: "Total pago", value: t.totalPago },
              { label: "Saldo", value: t.saldo },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border p-3">
                <p className="label-caps">{k.label}</p>
                <p className="num mt-2 text-sm text-foreground">{brl(k.value)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setModal("servico")}>Novo serviço</Button>
          <Button size="sm" variant="outline" onClick={() => setModal("parcela")}>Nova parcela</Button>
          <Link to="/propostas"><Button size="sm" variant="outline">Nova proposta</Button></Link>
          <Link to="/financeiro"><Button size="sm" variant="ghost">Novo lançamento</Button></Link>
        </div>
      </Card>

      <div className="mb-4 -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${aba === a ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {a}
          </button>
        ))}
      </div>

      <Card>
        {aba === "Resumo" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Honorários", brl(t.honorarios)],
              ["Aditivo", brl(t.aditivo)],
              ["Contrato", cliente.numeroContrato || "—"],
              ["Data inicial", formatDate(cliente.dataInicial)],
              ["CPF / CNPJ", cliente.documento || "—"],
              ["Responsável", cliente.responsavel ?? "—"],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border border-border p-4">
                <p className="label-caps">{l}</p>
                <p className="num mt-2 text-sm">{v}</p>
              </div>
            ))}
          </div>
        ) : null}

        {aba === "Serviços" ? (
          servicos.length ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Descrição", "Categoria", "Área/Qtd", "Valor/m²", "Total"].map((h) => <th key={h} className="label-caps px-2 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {servicos.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-3">{s.descricao}</td>
                    <td className="px-2 py-3 text-muted-foreground">{s.categoria}</td>
                    <td className="num px-2 py-3 text-right">{num(s.area)}</td>
                    <td className="num px-2 py-3 text-right">{brl(s.valorM2)}</td>
                    <td className="px-2 py-3 text-right"><Money value={servicoTotal(s.area, s.valorM2)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon={FileText} title="Nenhum serviço no contrato" action={<Button onClick={() => setModal("servico")}>Novo serviço</Button>} />
        ) : null}

        {aba === "Parcelas" ? (
          parcelas.length ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Parcela", "Vencimento", "Valor", "Pago em", "Valor pago", "Status", ""].map((h) => <th key={h} className="label-caps px-2 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {parcelas.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="num px-2 py-3">{p.parcela}</td>
                    <td className="num px-2 py-3">{formatDate(p.vencimento)}</td>
                    <td className="px-2 py-3 text-right"><Money value={p.valor} /></td>
                    <td className="num px-2 py-3">{formatDate(p.dataPagamento)}</td>
                    <td className="px-2 py-3 text-right"><Money value={p.valorPago ?? 0} tone="positive" /></td>
                    <td className="px-2 py-3"><StatusPill status={parcelaStatus(p)} /></td>
                    <td className="px-2 py-3 text-right">
                      {!p.dataPagamento ? (
                        <Button size="sm" variant="outline" onClick={() => dispatch({ type: "update", entidade: "parcelas", id: p.id, patch: { dataPagamento: todayISO(), valorPago: p.valor } })}>
                          Marcar como pago
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon={FileText} title="Nenhuma parcela lançada" action={<Button onClick={() => setModal("parcela")}>Nova parcela</Button>} />
        ) : null}

        {aba === "Reembolsáveis" ? (
          reembolsaveis.length ? (
            <ul className="divide-y divide-border">
              {reembolsaveis.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate">{r.descricao}</p><p className="num text-xs text-muted-foreground">{formatDate(r.data)} · Recibo {r.recibo ?? "—"}</p></div>
                  <Money value={r.valor} tone="negative" />
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={FileText} title="Sem despesas reembolsáveis" />
        ) : null}

        {aba === "Impostos NF" ? (
          impostos.length ? (
            <ul className="divide-y divide-border">
              {impostos.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate">{r.descricao}</p><p className="num text-xs text-muted-foreground">{formatDate(r.data)} · NF {r.nf ?? "—"}</p></div>
                  <Money value={r.valor} tone="negative" />
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={FileText} title="Sem impostos lançados" />
        ) : null}

        {aba === "Repasses" ? (
          repasses.length ? (
            <ul className="divide-y divide-border">
              {repasses.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{state.engenheiros.find((e) => e.id === r.engenheiroId)?.nome ?? "—"}</p>
                    <p className="num text-xs text-muted-foreground">{r.marco} · parcela {r.parcela} · PIX {pixDoEngenheiro(state, r.engenheiroId)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Money value={r.valor} tone="negative" />
                    <div className="mt-1"><StatusPill status={repasseStatus(r)} /></div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={FileText} title="Sem repasses de engenharia" />
        ) : null}

        {aba === "Rentabilidade" && rent ? (
          <div className="space-y-2 text-sm">
            {[
              ["Recebido", rent.recebido],
              ["(−) Reembolsáveis", -rent.reembolsaveis],
              ["(−) Engenharia", -rent.engenharia],
              ["(−) Impostos NF", -rent.impostos],
              ["(−) Custas fixas (rateio)", -rent.custasFixas],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between border-b border-border py-2">
                <span className="text-muted-foreground">{l}</span>
                <Money value={v as number} tone="auto" />
              </div>
            ))}
            <div className="flex justify-between py-2 font-medium">
              <span>Resultado · margem {pct(rent.margem)}</span>
              <Money value={rent.resultado} tone="auto" />
            </div>
            <Field label="Custas fixas (rateio)" className="max-w-xs pt-3">
              <TextInput
                type="number"
                value={cliente.custasFixas ?? 0}
                onChange={(e) => dispatch({ type: "update", entidade: "clientes", id: cliente.id, patch: { custasFixas: Number(e.target.value) } })}
              />
            </Field>
          </div>
        ) : null}

        {aba === "Notas" ? (
          <Field label="Notas do projeto">
            <TextInput
              value={cliente.notas ?? ""}
              placeholder="Anotações internas"
              onChange={(e) => dispatch({ type: "update", entidade: "clientes", id: cliente.id, patch: { notas: e.target.value } })}
            />
          </Field>
        ) : null}
      </Card>

      <Modal
        open={modal === "servico"}
        onClose={() => setModal(null)}
        title="Novo serviço"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!servico.descricao) return;
                dispatch({
                  type: "add",
                  entidade: "servicos",
                  item: {
                    id: uid(),
                    clienteId: cliente.id,
                    descricao: servico.descricao,
                    categoria: servico.categoria as "Honorários" | "Aditivo" | "Engenharia",
                    area: servico.area,
                    valorM2: servico.valorM2,
                  },
                });
                setServico({ descricao: "", categoria: "Honorários", area: 0, valorM2: 0 });
                setModal(null);
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descrição" className="sm:col-span-2"><TextInput value={servico.descricao} onChange={(e) => setServico({ ...servico, descricao: e.target.value })} /></Field>
          <Field label="Categoria"><SelectInput options={state.listas.categoriasServico} value={servico.categoria} onChange={(e) => setServico({ ...servico, categoria: e.target.value })} /></Field>
          <Field label="Área / Qtd"><TextInput type="number" value={servico.area} onChange={(e) => setServico({ ...servico, area: Number(e.target.value) })} /></Field>
          <Field label="Valor / m²"><TextInput type="number" value={servico.valorM2} onChange={(e) => setServico({ ...servico, valorM2: Number(e.target.value) })} /></Field>
          <Field label="Total (calculado)"><div className="num flex h-10 items-center rounded-lg bg-muted/60 px-3 text-sm text-muted-foreground">{brl(servicoTotal(servico.area, servico.valorM2))}</div></Field>
        </div>
      </Modal>

      <Modal
        open={modal === "parcela"}
        onClose={() => setModal(null)}
        title="Nova parcela"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!parcela.parcela) return;
                dispatch({ type: "add", entidade: "parcelas", item: { id: uid(), clienteId: cliente.id, ...parcela } });
                setParcela({ parcela: "", vencimento: todayISO(), valor: 0 });
                setModal(null);
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parcela"><TextInput placeholder="1/4" value={parcela.parcela} onChange={(e) => setParcela({ ...parcela, parcela: e.target.value })} /></Field>
          <Field label="Vencimento"><TextInput type="date" value={parcela.vencimento} onChange={(e) => setParcela({ ...parcela, vencimento: e.target.value })} /></Field>
          <Field label="Valor"><TextInput type="number" value={parcela.valor} onChange={(e) => setParcela({ ...parcela, valor: Number(e.target.value) })} /></Field>
        </div>
      </Modal>

      <SectionTitle title="" />
    </AppShell>
  );
}