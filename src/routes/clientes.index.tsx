import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KanbanSquare, List, Settings, Users, X } from "lucide-react";
import { AppShell, NovoButton } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card, EmptyState, Money, Stagger, StaggerItem } from "@/components/common/primitives";
import { Field, SelectInput, TextInput } from "@/components/common/fields";
import { Modal } from "@/components/common/Modal";
import { clienteTotais } from "@/lib/calc";
import { brl, todayISO, uid } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes & Contratos — Luz Botelho Arquitetura" },
      {
        name: "description",
        content: "Pipeline de clientes, contratos e saldo a receber do escritório de arquitetura.",
      },
      { property: "og:title", content: "Clientes & Contratos — Luz Botelho Arquitetura" },
      { property: "og:description", content: "CRM com funil editável, contratos e valores por etapa." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const state = useApp();
  const dispatch = useDispatch();
  const [modo, setModo] = useState<"kanban" | "lista">("kanban");
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState<"nome" | "total" | "saldo">("nome");
  const [aberto, setAberto] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState("");
  const [arrastando, setArrastando] = useState<string | null>(null);

  const [form, setForm] = useState({
    codigo: `LB${String(new Date().getFullYear()).slice(2)}${String(state.clientes.length + 1).padStart(2, "0")}`,
    nome: "",
    documento: "",
    tipoProjeto: state.listas.tiposProjeto[0] ?? "",
    endereco: "",
    numeroContrato: "",
    dataInicial: todayISO(),
    etapa: state.listas.etapas[0] ?? "Lead",
    responsavel: "Luz Botelho",
  });

  const filtrados = useMemo(() => {
    const arr = state.clientes.filter(
      (c) =>
        (!busca || `${c.nome} ${c.codigo}`.toLowerCase().includes(busca.toLowerCase())) &&
        (!filtroEtapa || c.etapa === filtroEtapa) &&
        (!filtroTipo || c.tipoProjeto === filtroTipo),
    );
    return arr.sort((a, b) => {
      if (ordem === "nome") return a.nome.localeCompare(b.nome);
      const ta = clienteTotais(state, a.id);
      const tb = clienteTotais(state, b.id);
      return ordem === "total" ? tb.total - ta.total : tb.saldo - ta.saldo;
    });
  }, [state, busca, filtroEtapa, filtroTipo, ordem]);

  const salvar = () => {
    if (!form.nome) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    dispatch({ type: "add", entidade: "clientes", item: { id: uid(), ...form } });
    setAberto(false);
    setForm({ ...form, nome: "", documento: "", endereco: "", numeroContrato: "" });
  };

  const moverEtapa = (etapa: string, dir: -1 | 1) => {
    const etapas = [...state.listas.etapas];
    const i = etapas.indexOf(etapa);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= etapas.length) return;
    const a = etapas[i]!;
    etapas[i] = etapas[j]!;
    etapas[j] = a;
    dispatch({ type: "setListas", listas: { etapas } });
  };

  const removerEtapa = (etapa: string) => {
    const emUso = state.clientes.filter((c) => c.etapa === etapa).length;
    if (emUso > 0) {
      toast.error(`Mova os ${emUso} cliente(s) dessa etapa antes de excluí-la.`);
      return;
    }
    dispatch({ type: "setListas", listas: { etapas: state.listas.etapas.filter((e) => e !== etapa) } });
  };

  return (
    <AppShell title="Clientes & Contratos" action={<NovoButton label="Novo cliente" onClick={() => setAberto(true)} />}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setModo("kanban")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${modo === "kanban" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            <KanbanSquare className="h-3.5 w-3.5" strokeWidth={1.5} /> Kanban
          </button>
          <button
            onClick={() => setModo("lista")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${modo === "lista" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            <List className="h-3.5 w-3.5" strokeWidth={1.5} /> Lista
          </button>
        </div>
        <TextInput
          placeholder="Buscar cliente ou código"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-9 w-56"
        />
        <SelectInput
          className="h-9 w-44"
          options={state.listas.etapas}
          placeholder="Todas as etapas"
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
        />
        <SelectInput
          className="h-9 w-52"
          options={state.listas.tiposProjeto}
          placeholder="Todos os tipos"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        />
        <SelectInput
          className="h-9 w-44"
          options={[
            { value: "nome", label: "Ordenar: nome" },
            { value: "total", label: "Ordenar: total" },
            { value: "saldo", label: "Ordenar: saldo" },
          ]}
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as typeof ordem)}
        />
        <Link to="/configuracoes" className="ml-auto">
          <Button size="sm" variant="outline" aria-label="Configurações do funil">
            <Settings className="h-4 w-4" strokeWidth={1.5} /> Configurar listas
          </Button>
        </Link>
      </div>

      {state.clientes.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nenhum cliente cadastrado"
            description="Cadastre o primeiro cliente para começar a montar o funil comercial."
            action={<Button onClick={() => setAberto(true)}>Novo cliente</Button>}
          />
        </Card>
      ) : modo === "kanban" ? (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {state.listas.etapas.map((etapa) => {
            const cards = filtrados.filter((c) => c.etapa === etapa);
            const soma = cards.reduce((a, c) => a + clienteTotais(state, c.id).total, 0);
            return (
              <div
                key={etapa}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastando)
                    dispatch({ type: "update", entidade: "clientes", id: arrastando, patch: { etapa } });
                  setArrastando(null);
                }}
                className="w-[280px] shrink-0 rounded-2xl border border-border bg-card/60 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <p className="label-caps truncate">{etapa}</p>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {cards.length} · {brl(soma)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => moverEtapa(etapa, -1)} aria-label="Mover etapa para a esquerda">
                      ‹
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => moverEtapa(etapa, 1)} aria-label="Mover etapa para a direita">
                      ›
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removerEtapa(etapa)} aria-label="Excluir etapa">
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
                <Stagger className="space-y-2">
                  {cards.map((c) => {
                    const t = clienteTotais(state, c.id);
                    return (
                      <StaggerItem key={c.id}>
                        <div
                          draggable
                          onDragStart={() => setArrastando(c.id)}
                          className="cursor-grab rounded-xl border border-border bg-card p-3 active:cursor-grabbing"
                        >
                          <Link to="/clientes/$clienteId" params={{ clienteId: c.id }}>
                            <p className="truncate text-sm text-foreground">{c.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.tipoProjeto}</p>
                            <div className="mt-3 flex items-baseline justify-between gap-2 text-xs">
                              <span className="num text-muted-foreground">{brl(t.total)}</span>
                              <Money value={t.saldo} className="text-xs" />
                            </div>
                            <p className="mt-2 truncate text-[11px] text-muted-foreground">
                              {c.responsavel ?? "Sem responsável"}
                            </p>
                          </Link>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </div>
            );
          })}
          <div className="w-[240px] shrink-0 rounded-2xl border border-dashed border-border p-3">
            <p className="label-caps">Nova etapa</p>
            <TextInput
              className="mt-2 h-9"
              placeholder="Nome da etapa"
              value={novaEtapa}
              onChange={(e) => setNovaEtapa(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
                if (!novaEtapa.trim()) {
                  toast.error("Informe o nome da etapa.");
                  return;
                }
                dispatch({ type: "setListas", listas: { etapas: [...state.listas.etapas, novaEtapa.trim()] } });
                setNovaEtapa("");
              }}
            >
              Adicionar etapa
            </Button>
          </div>
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Código", "Cliente", "Tipo", "Etapa", "Total", "Pago", "Saldo"].map((h) => (
                  <th key={h} className="label-caps px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const t = clienteTotais(state, c.id);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="num px-4 py-3 text-muted-foreground">{c.codigo}</td>
                    <td className="px-4 py-3">
                      <Link to="/clientes/$clienteId" params={{ clienteId: c.id }} className="hover:text-primary">
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.tipoProjeto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.etapa}</td>
                    <td className="px-4 py-3 text-right"><Money value={t.total} /></td>
                    <td className="px-4 py-3 text-right"><Money value={t.totalPago} tone="positive" /></td>
                    <td className="px-4 py-3 text-right"><Money value={t.saldo} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Novo cliente"
        description="Campos destacados são editáveis; totais são calculados automaticamente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar cliente</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código"><TextInput value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></Field>
          <Field label="Cliente"><TextInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="CPF / CNPJ"><TextInput value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></Field>
          <Field label="Tipo de projeto">
            <SelectInput options={state.listas.tiposProjeto} value={form.tipoProjeto} onChange={(e) => setForm({ ...form, tipoProjeto: e.target.value })} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2"><TextInput value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></Field>
          <Field label="Nº do contrato"><TextInput value={form.numeroContrato} onChange={(e) => setForm({ ...form, numeroContrato: e.target.value })} /></Field>
          <Field label="Data inicial"><TextInput type="date" value={form.dataInicial} onChange={(e) => setForm({ ...form, dataInicial: e.target.value })} /></Field>
          <Field label="Etapa do funil">
            <SelectInput options={state.listas.etapas} value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })} />
          </Field>
          <Field label="Responsável">
            <SelectInput
              options={state.listas.responsaveis}
              placeholder="Selecionar"
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </AppShell>
  );
}