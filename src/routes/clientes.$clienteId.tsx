import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Paperclip, Trash2, Upload } from "lucide-react";
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
import {
  enviarAnexo,
  listarAnexos,
  pastaCliente,
  removerAnexo,
  urlAnexo,
  type Anexo,
} from "@/lib/storage";

function somarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function tamanhoLegivel(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  "Anexos",
  "Notas",
] as const;

function DetalheCliente() {
  const { clienteId } = Route.useParams();
  const state = useApp();
  const dispatch = useDispatch();
  const [aba, setAba] = useState<(typeof ABAS)[number]>("Resumo");
  const [modal, setModal] = useState<"servico" | "parcela" | null>(null);
  const [servico, setServico] = useState({ descricao: "", categoria: "Honorários", area: 0, valorM2: 0 });
  const [gerarParcelas, setGerarParcelas] = useState({
    valorTotal: 0,
    quantidade: 1,
    primeiroVencimento: todayISO(),
    intervaloDias: 30,
  });
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregandoAnexos(true);
    listarAnexos(pastaCliente(clienteId))
      .then((lista) => {
        if (!cancelado) setAnexos(lista);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Não foi possível carregar os anexos.");
      })
      .finally(() => {
        if (!cancelado) setCarregandoAnexos(false);
      });
    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  const onEnviarArquivo = async (file: File) => {
    setEnviando(true);
    try {
      await enviarAnexo(pastaCliente(clienteId), file);
      setAnexos(await listarAnexos(pastaCliente(clienteId)));
      toast.success("Arquivo enviado.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  };

  const onBaixarArquivo = async (path: string) => {
    try {
      window.open(await urlAnexo(path), "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar o link de download.");
    }
  };

  const onRemoverArquivo = async (path: string) => {
    try {
      await removerAnexo(path);
      setAnexos((prev) => prev.filter((a) => a.path !== path));
    } catch (err) {
      console.error(err);
      toast.error("Falha ao remover o arquivo.");
    }
  };

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

        {aba === "Anexos" ? (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="label-caps">Arquivos do projeto</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onEnviarArquivo(file);
                  e.target.value = "";
                }}
              />
              <Button size="sm" variant="outline" disabled={enviando} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" strokeWidth={1.5} />
                {enviando ? "Enviando…" : "Enviar arquivo"}
              </Button>
            </div>
            {carregandoAnexos ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : anexos.length ? (
              <ul className="divide-y divide-border">
                {anexos.map((a) => (
                  <li key={a.path} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate">{a.nome.replace(/^\d+-/, "")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.criadoEm)} {a.tamanho ? `· ${tamanhoLegivel(a.tamanho)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onBaixarArquivo(a.path)} aria-label="Baixar">
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemoverArquivo(a.path)} aria-label="Remover">
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Paperclip} title="Nenhum anexo" description="Envie contratos, comprovantes ou outros documentos do projeto." />
            )}
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
                if (!servico.descricao) {
                  toast.error("Informe a descrição do serviço.");
                  return;
                }
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
        description="Gera uma ou várias parcelas de uma vez, dividindo o valor total igualmente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                const { valorTotal, quantidade, primeiroVencimento, intervaloDias } = gerarParcelas;
                if (!valorTotal || quantidade < 1) {
                  toast.error("Informe o valor total e a quantidade de parcelas.");
                  return;
                }
                const valorBase = Math.round((valorTotal / quantidade) * 100) / 100;
                const valorUltima = Math.round((valorTotal - valorBase * (quantidade - 1)) * 100) / 100;
                for (let i = 0; i < quantidade; i++) {
                  dispatch({
                    type: "add",
                    entidade: "parcelas",
                    item: {
                      id: uid(),
                      clienteId: cliente.id,
                      parcela: `${i + 1}/${quantidade}`,
                      vencimento: somarDias(primeiroVencimento, i * intervaloDias),
                      valor: i === quantidade - 1 ? valorUltima : valorBase,
                    },
                  });
                }
                setGerarParcelas({ valorTotal: 0, quantidade: 1, primeiroVencimento: todayISO(), intervaloDias: 30 });
                setModal(null);
              }}
            >
              {gerarParcelas.quantidade > 1 ? `Gerar ${gerarParcelas.quantidade} parcelas` : "Salvar parcela"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor total">
            <TextInput
              type="number"
              value={gerarParcelas.valorTotal}
              onChange={(e) => setGerarParcelas({ ...gerarParcelas, valorTotal: Number(e.target.value) })}
            />
          </Field>
          <Field label="Quantidade de parcelas">
            <TextInput
              type="number"
              min={1}
              value={gerarParcelas.quantidade}
              onChange={(e) => setGerarParcelas({ ...gerarParcelas, quantidade: Math.max(1, Number(e.target.value)) })}
            />
          </Field>
          <Field label="Vencimento da 1ª parcela">
            <TextInput
              type="date"
              value={gerarParcelas.primeiroVencimento}
              onChange={(e) => setGerarParcelas({ ...gerarParcelas, primeiroVencimento: e.target.value })}
            />
          </Field>
          <Field label="Intervalo entre parcelas (dias)">
            <TextInput
              type="number"
              value={gerarParcelas.intervaloDias}
              onChange={(e) => setGerarParcelas({ ...gerarParcelas, intervaloDias: Number(e.target.value) })}
            />
          </Field>
          <Field label="Valor de cada parcela (calculado)" className="sm:col-span-2">
            <div className="num flex h-10 items-center rounded-lg bg-muted/60 px-3 text-sm text-muted-foreground">
              {gerarParcelas.quantidade > 0 ? brl(gerarParcelas.valorTotal / gerarParcelas.quantidade) : brl(0)}
            </div>
          </Field>
        </div>
      </Modal>

      <SectionTitle title="" />
    </AppShell>
  );
}