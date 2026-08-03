import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { AppShell, NovoButton } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, Money, StatusPill } from "@/components/common/primitives";
import { Field, SelectInput, TextInput } from "@/components/common/fields";
import { Modal } from "@/components/common/Modal";
import { FluxoChart } from "@/components/dashboard/Charts";
import {
  contaFixaMedia,
  contaFixaTotal,
  nomeCliente,
  parcelaStatus,
  rentabilidade,
  repasseStatus,
  resumoMensal,
} from "@/lib/calc";
import { brl, formatDate, mesDaData, MESES, pct, todayISO, uid } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Luz Botelho Arquitetura" },
      { name: "description", content: "Lançamentos, fluxo de caixa, contas a receber e a pagar, reembolsáveis e rentabilidade." },
      { property: "og:title", content: "Financeiro — Luz Botelho Arquitetura" },
      { property: "og:description", content: "Controle completo do caixa da empresa e pessoal." },
    ],
  }),
  component: Financeiro,
});

const ABAS = [
  "Lançamentos",
  "Fluxo de Caixa",
  "Contas a Receber",
  "Contas a Pagar",
  "Reembolsáveis & Impostos",
  "Rentabilidade",
] as const;

function Financeiro() {
  const state = useApp();
  const dispatch = useDispatch();
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Lançamentos");
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ pe: "", categoria: "", conta: "", forma: "", busca: "" });
  const [novo, setNovo] = useState({
    data: todayISO(),
    pe: "Empresa",
    categoria: state.listas.categorias[0] ?? "",
    descricao: "",
    entrada: 0,
    saida: 0,
    forma: state.listas.formas[0] ?? "",
    conta: state.listas.contas[0] ?? "",
    obs: "",
  });

  const lanc = state.lancamentos.filter(
    (l) =>
      (!f.pe || l.pe === f.pe) &&
      (!f.categoria || l.categoria === f.categoria) &&
      (!f.conta || l.conta === f.conta) &&
      (!f.forma || l.forma === f.forma) &&
      (!f.busca || l.descricao.toLowerCase().includes(f.busca.toLowerCase())),
  );
  const totalEntrada = lanc.reduce((a, l) => a + l.entrada, 0);
  const totalSaida = lanc.reduce((a, l) => a + l.saida, 0);
  const resumo = resumoMensal(state);

  return (
    <AppShell title="Financeiro" action={<NovoButton label="Novo lançamento" onClick={() => setAberto(true)} />}>
      <div className="mb-4 -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {ABAS.map((a) => (
          <button key={a} onClick={() => setAba(a)} className={`shrink-0 rounded-lg px-3 py-2 text-sm ${aba === a ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {a}
          </button>
        ))}
      </div>

      {aba === "Lançamentos" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <TextInput className="h-9 w-56" placeholder="Buscar descrição" value={f.busca} onChange={(e) => setF({ ...f, busca: e.target.value })} />
            <SelectInput className="h-9 w-36" options={["Empresa", "Pessoal"]} placeholder="P/E" value={f.pe} onChange={(e) => setF({ ...f, pe: e.target.value })} />
            <SelectInput className="h-9 w-48" options={state.listas.categorias} placeholder="Categoria" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
            <SelectInput className="h-9 w-52" options={state.listas.contas} placeholder="Conta" value={f.conta} onChange={(e) => setF({ ...f, conta: e.target.value })} />
            <SelectInput className="h-9 w-36" options={state.listas.formas} placeholder="Forma" value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })} />
          </div>
          <Card className="overflow-x-auto p-0">
            {lanc.length ? (
              <table className="w-full min-w-[900px] text-sm">
                <thead><tr className="border-b border-border">{["Data", "Mês", "P/E", "Categoria", "Descrição", "Entrada", "Saída", "Forma", "Conta"].map((h) => <th key={h} className="label-caps px-4 py-3 text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {lanc.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="num px-4 py-3">{formatDate(l.data)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{mesDaData(l.data)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.pe}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.categoria}</td>
                      <td className="px-4 py-3">{l.descricao}</td>
                      <td className="px-4 py-3 text-right">{l.entrada ? <Money value={l.entrada} tone="positive" /> : "—"}</td>
                      <td className="px-4 py-3 text-right">{l.saida ? <Money value={l.saida} tone="negative" /> : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.forma ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.conta ?? "—"}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-medium">
                    <td className="px-4 py-3" colSpan={5}>Totais</td>
                    <td className="px-4 py-3 text-right"><Money value={totalEntrada} tone="positive" /></td>
                    <td className="px-4 py-3 text-right"><Money value={totalSaida} tone="negative" /></td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            ) : (
              <EmptyState icon={Wallet} title="Nenhum lançamento" description="Registre entradas e saídas para alimentar o fluxo de caixa." action={<Button onClick={() => setAberto(true)}>Novo lançamento</Button>} />
            )}
          </Card>
        </>
      ) : null}

      {aba === "Fluxo de Caixa" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Ano"><TextInput type="number" className="w-32" value={state.ano} onChange={(e) => dispatch({ type: "setAno", ano: Number(e.target.value) })} /></Field>
              <Field label="Saldo inicial do ano"><TextInput type="number" className="w-44" value={state.saldoInicial} onChange={(e) => dispatch({ type: "setSaldoInicial", valor: Number(e.target.value) })} /></Field>
            </div>
          </Card>
          <Card><FluxoChart data={resumo} /></Card>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-border">{["Mês", "Entradas", "Saídas", "Saldo", "Acumulado", "Recebido de clientes"].map((h) => <th key={h} className="label-caps px-4 py-3 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {resumo.map((r) => (
                  <tr key={r.mes} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{r.label}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.entradas} tone="positive" /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.saidas} tone="negative" /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.saldo} tone="auto" /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.acumulado} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.recebidoClientes} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : null}

      {aba === "Contas a Receber" ? (
        <Card className="overflow-x-auto p-0">
          {state.parcelas.length ? (
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="border-b border-border">{["Cliente", "Parcela", "Vencimento", "Valor", "Status", ""].map((h) => <th key={h} className="label-caps px-4 py-3 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {state.parcelas.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{nomeCliente(state, p.clienteId)}</td>
                    <td className="num px-4 py-3">{p.parcela}</td>
                    <td className="num px-4 py-3">{formatDate(p.vencimento)}</td>
                    <td className="px-4 py-3 text-right"><Money value={p.valor} /></td>
                    <td className="px-4 py-3"><StatusPill status={parcelaStatus(p)} /></td>
                    <td className="px-4 py-3 text-right">
                      {!p.dataPagamento ? (
                        <Button size="sm" variant="outline" onClick={() => dispatch({ type: "update", entidade: "parcelas", id: p.id, patch: { dataPagamento: todayISO(), valorPago: p.valor } })}>Marcar como pago</Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon={Wallet} title="Nenhuma parcela a receber" />}
        </Card>
      ) : null}

      {aba === "Contas a Pagar" ? (
        <div className="space-y-4">
          <Card className="overflow-x-auto p-0">
            {state.contasFixas.length ? (
              <table className="w-full min-w-[1100px] text-sm">
                <thead><tr className="border-b border-border">{["Grupo", "Dia", "Descrição", ...MESES, "Total", "Média"].map((h) => <th key={h} className="label-caps px-3 py-3 text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {state.contasFixas.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 text-muted-foreground">{c.grupo}</td>
                      <td className="num px-3 py-3">{c.dia}</td>
                      <td className="px-3 py-3">{c.descricao}</td>
                      {c.meses.map((m, i) => (
                        <td key={i} className="num px-3 py-3 text-right text-muted-foreground">{m ? brl(m) : "—"}</td>
                      ))}
                      <td className="px-3 py-3 text-right"><Money value={contaFixaTotal(c.meses)} /></td>
                      <td className="px-3 py-3 text-right"><Money value={contaFixaMedia(c.meses)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={Wallet} title="Nenhuma conta fixa cadastrada" />}
          </Card>
          <Card className="overflow-x-auto p-0">
            {state.repasses.length ? (
              <table className="w-full min-w-[820px] text-sm">
                <thead><tr className="border-b border-border">{["Cliente", "Engenheiro", "Chave PIX", "Marco", "Valor", "Status", ""].map((h) => <th key={h} className="label-caps px-4 py-3 text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {state.repasses.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{nomeCliente(state, r.clienteId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{state.engenheiros.find((e) => e.id === r.engenheiroId)?.nome ?? "—"}</td>
                      <td className="num px-4 py-3 text-muted-foreground">{state.engenheiros.find((e) => e.id === r.engenheiroId)?.pix ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.marco}</td>
                      <td className="px-4 py-3 text-right"><Money value={r.valor} tone="negative" /></td>
                      <td className="px-4 py-3"><StatusPill status={repasseStatus(r)} /></td>
                      <td className="px-4 py-3 text-right">
                        {!r.dataPagamento ? (
                          <Button size="sm" variant="outline" onClick={() => dispatch({ type: "update", entidade: "repasses", id: r.id, patch: { dataPagamento: todayISO() } })}>Marcar como pago</Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={Wallet} title="Nenhum repasse de engenharia" />}
          </Card>
        </div>
      ) : null}

      {aba === "Reembolsáveis & Impostos" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="label-caps mb-3">Reembolsáveis</p>
            {state.reembolsaveis.length ? (
              <ul className="divide-y divide-border">
                {state.reembolsaveis.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0"><p className="truncate">{nomeCliente(state, r.clienteId)} — {r.descricao}</p><p className="num text-xs text-muted-foreground">{formatDate(r.data)}</p></div>
                    <Money value={r.valor} tone="negative" />
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={Wallet} title="Sem reembolsáveis" />}
          </Card>
          <Card>
            <p className="label-caps mb-3">Impostos NF</p>
            {state.impostos.length ? (
              <ul className="divide-y divide-border">
                {state.impostos.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0"><p className="truncate">{nomeCliente(state, r.clienteId)} — {r.descricao}</p><p className="num text-xs text-muted-foreground">{formatDate(r.data)} · NF {r.nf ?? "—"}</p></div>
                    <Money value={r.valor} tone="negative" />
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={Wallet} title="Sem impostos" />}
          </Card>
        </div>
      ) : null}

      {aba === "Rentabilidade" ? (
        <Card className="overflow-x-auto p-0">
          {state.clientes.length ? (
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="border-b border-border">{["Projeto", "Recebido", "Reembolsáveis", "Engenharia", "Impostos", "Custas fixas", "Resultado", "Margem"].map((h) => <th key={h} className="label-caps px-4 py-3 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {rentabilidade(state).map((r) => (
                  <tr key={r.cliente.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{r.cliente.nome}</td>
                    <td className="px-4 py-3 text-right"><Money value={r.recebido} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.reembolsaveis} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.engenharia} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.impostos} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.custasFixas} /></td>
                    <td className="px-4 py-3 text-right"><Money value={r.resultado} tone="auto" /></td>
                    <td className="num px-4 py-3 text-right text-muted-foreground">{pct(r.margem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon={Wallet} title="Sem projetos para analisar" />}
        </Card>
      ) : null}

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Novo lançamento"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!novo.descricao) {
                  toast.error("Informe a descrição do lançamento.");
                  return;
                }
                dispatch({
                  type: "add",
                  entidade: "lancamentos",
                  item: { id: uid(), ...novo, pe: novo.pe as "Empresa" | "Pessoal" },
                });
                setNovo({ ...novo, descricao: "", entrada: 0, saida: 0, obs: "" });
                setAberto(false);
              }}
            >
              Salvar lançamento
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data"><TextInput type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} /></Field>
          <Field label="Mês (calculado)"><div className="num flex h-10 items-center rounded-lg bg-muted/60 px-3 text-sm text-muted-foreground">{mesDaData(novo.data)}</div></Field>
          <Field label="Empresa / Pessoal"><SelectInput options={["Empresa", "Pessoal"]} value={novo.pe} onChange={(e) => setNovo({ ...novo, pe: e.target.value })} /></Field>
          <Field label="Categoria"><SelectInput options={state.listas.categorias} value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></Field>
          <Field label="Descrição" className="sm:col-span-2"><TextInput value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} /></Field>
          <Field label="Entrada"><TextInput type="number" value={novo.entrada} onChange={(e) => setNovo({ ...novo, entrada: Number(e.target.value) })} /></Field>
          <Field label="Saída"><TextInput type="number" value={novo.saida} onChange={(e) => setNovo({ ...novo, saida: Number(e.target.value) })} /></Field>
          <Field label="Forma"><SelectInput options={state.listas.formas} value={novo.forma} onChange={(e) => setNovo({ ...novo, forma: e.target.value })} /></Field>
          <Field label="Conta"><SelectInput options={state.listas.contas} value={novo.conta} onChange={(e) => setNovo({ ...novo, conta: e.target.value })} /></Field>
          <Field label="Observação" className="sm:col-span-2"><TextInput value={novo.obs} onChange={(e) => setNovo({ ...novo, obs: e.target.value })} /></Field>
        </div>
      </Modal>
    </AppShell>
  );
}