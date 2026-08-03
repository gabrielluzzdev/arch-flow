import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { AppShell, NovoButton } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, Money, StatusPill } from "@/components/common/primitives";
import { Field, SelectInput, TextArea, TextInput } from "@/components/common/fields";
import { Modal } from "@/components/common/Modal";
import { propostaTotais } from "@/lib/calc";
import { brl, formatDate, todayISO, uid } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";
import type { PropostaItem } from "@/lib/types";

export const Route = createFileRoute("/propostas")({
  head: () => ({
    meta: [
      { title: "Propostas & Orçamentos — Luz Botelho Arquitetura" },
      { name: "description", content: "Monte orçamentos com itens, desconto e condições de pagamento." },
      { property: "og:title", content: "Propostas & Orçamentos — Luz Botelho Arquitetura" },
      { property: "og:description", content: "Propostas com cálculo automático e pré-visualização." },
    ],
  }),
  component: Propostas,
});

function Propostas() {
  const state = useApp();
  const dispatch = useDispatch();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    clienteId: "",
    clienteNome: "",
    titulo: "",
    escopo: "",
    desconto: 0,
    condicoes: "",
    validade: todayISO(),
  });
  const [itens, setItens] = useState<PropostaItem[]>([{ id: uid(), descricao: "", qtd: 1, valorUnit: 0 }]);
  const { subtotal, total } = propostaTotais(itens, form.desconto);

  const salvar = (status: "Rascunho" | "Enviada") => {
    const nome = form.clienteId ? (state.clientes.find((c) => c.id === form.clienteId)?.nome ?? "") : form.clienteNome;
    if (!form.titulo || !nome) return;
    dispatch({
      type: "add",
      entidade: "propostas",
      item: {
        id: uid(),
        clienteNome: nome,
        titulo: form.titulo,
        escopo: form.escopo,
        itens,
        desconto: form.desconto,
        condicoes: form.condicoes,
        validade: form.validade,
        status,
        criadaEm: todayISO(),
        ...(form.clienteId ? { clienteId: form.clienteId } : {}),
      },
    });
    if (status === "Enviada" && form.clienteId)
      dispatch({ type: "update", entidade: "clientes", id: form.clienteId, patch: { etapa: "Proposta enviada" } });
    setAberto(false);
    setItens([{ id: uid(), descricao: "", qtd: 1, valorUnit: 0 }]);
  };

  return (
    <AppShell title="Propostas" action={<NovoButton label="Nova proposta" onClick={() => setAberto(true)} />}>
      {state.propostas.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.propostas.map((p) => {
            const t = propostaTotais(p.itens, p.desconto);
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{p.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.clienteNome}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.escopo}</p>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="label-caps">Total</span>
                  <Money value={t.total} />
                </div>
                <p className="num mt-1 text-xs text-muted-foreground">Validade {formatDate(p.validade)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.status === "Rascunho" ? (
                    <Button size="sm" variant="outline" onClick={() => dispatch({ type: "update", entidade: "propostas", id: p.id, patch: { status: "Enviada" } })}>
                      Marcar como enviada
                    </Button>
                  ) : null}
                  {p.status !== "Aceita" ? (
                    <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "update", entidade: "propostas", id: p.id, patch: { status: "Aceita" } })}>
                      Aceitar
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "add", entidade: "propostas", item: { ...p, id: uid(), status: "Rascunho", criadaEm: todayISO() } })}>
                    Duplicar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={FileText} title="Nenhuma proposta criada" description="Monte um orçamento com itens, desconto e condições de pagamento." action={<Button onClick={() => setAberto(true)}>Nova proposta</Button>} />
        </Card>
      )}

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Nova proposta"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => salvar("Rascunho")}>Salvar rascunho</Button>
            <Button onClick={() => salvar("Enviada")}>Marcar como enviada</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente existente"><SelectInput options={state.clientes.map((c) => ({ value: c.id, label: c.nome }))} placeholder="Selecionar" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} /></Field>
          <Field label="Ou novo cliente"><TextInput value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} /></Field>
          <Field label="Título" className="sm:col-span-2"><TextInput value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
          <Field label="Escopo" className="sm:col-span-2"><TextArea value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} /></Field>
        </div>

        <p className="label-caps mt-6 mb-2">Itens</p>
        <div className="space-y-2">
          {itens.map((it, i) => (
            <div key={it.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_130px_130px]">
              <TextInput placeholder="Descrição" value={it.descricao} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
              <TextInput type="number" value={it.qtd} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, qtd: Number(e.target.value) } : x)))} />
              <TextInput type="number" value={it.valorUnit} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, valorUnit: Number(e.target.value) } : x)))} />
              <div className="num flex h-10 items-center justify-end rounded-lg bg-muted/60 px-3 text-sm text-muted-foreground">{brl(it.qtd * it.valorUnit)}</div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setItens([...itens, { id: uid(), descricao: "", qtd: 1, valorUnit: 0 }])}>Adicionar item</Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Desconto"><TextInput type="number" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: Number(e.target.value) })} /></Field>
          <Field label="Total (calculado)"><div className="num flex h-10 items-center rounded-lg bg-muted/60 px-3 text-sm text-muted-foreground">{brl(total)} · subtotal {brl(subtotal)}</div></Field>
          <Field label="Condições de pagamento" className="sm:col-span-2"><TextInput value={form.condicoes} onChange={(e) => setForm({ ...form, condicoes: e.target.value })} /></Field>
          <Field label="Validade"><TextInput type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} /></Field>
        </div>
      </Modal>
    </AppShell>
  );
}