import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Database, Eraser } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/primitives";
import { Field, TextInput } from "@/components/common/fields";
import { uid } from "@/lib/format";
import { useApp, useDispatch } from "@/state/store";
import type { Listas } from "@/lib/types";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Luz Botelho Arquitetura" },
      { name: "description", content: "Edite listas, etapas do funil, engenheiros e parâmetros do ano." },
      { property: "og:title", content: "Configurações — Luz Botelho Arquitetura" },
      { property: "og:description", content: "Parâmetros e listas do sistema de gestão do escritório." },
    ],
  }),
  component: Configuracoes,
});

const GRUPOS: { chave: keyof Listas; titulo: string }[] = [
  { chave: "categorias", titulo: "Categorias de lançamento" },
  { chave: "formas", titulo: "Formas de pagamento" },
  { chave: "contas", titulo: "Contas" },
  { chave: "gruposContaFixa", titulo: "Grupos de conta fixa" },
  { chave: "tiposProjeto", titulo: "Tipos de projeto" },
  { chave: "categoriasServico", titulo: "Categorias de serviço" },
  { chave: "etapas", titulo: "Etapas do funil" },
];

function Configuracoes() {
  const state = useApp();
  const dispatch = useDispatch();
  const [novos, setNovos] = useState<Record<string, string>>({});

  const setLista = (chave: keyof Listas, valores: string[]) =>
    dispatch({ type: "setListas", listas: { [chave]: valores } as Partial<Listas> });

  return (
    <AppShell title="Configurações">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="label-caps mb-4">Parâmetros do ano</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ano"><TextInput type="number" value={state.ano} onChange={(e) => dispatch({ type: "setAno", ano: Number(e.target.value) })} /></Field>
            <Field label="Saldo inicial do ano"><TextInput type="number" value={state.saldoInicial} onChange={(e) => dispatch({ type: "setSaldoInicial", valor: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={() => dispatch({ type: "seed" })}>
              <Database className="h-4 w-4" strokeWidth={1.5} /> Carregar dados de exemplo
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: "reset" })}>
              <Eraser className="h-4 w-4" strokeWidth={1.5} /> Limpar dados
            </Button>
          </div>
        </Card>

        <Card>
          <p className="label-caps mb-4">Engenheiros e chaves PIX</p>
          <ul className="space-y-2">
            {state.engenheiros.map((e) => (
              <li key={e.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <TextInput value={e.nome} onChange={(ev) => dispatch({ type: "update", entidade: "engenheiros", id: e.id, patch: { nome: ev.target.value } })} />
                <TextInput value={e.pix} onChange={(ev) => dispatch({ type: "update", entidade: "engenheiros", id: e.id, patch: { pix: ev.target.value } })} />
                <Button variant="danger" size="sm" onClick={() => dispatch({ type: "remove", entidade: "engenheiros", id: e.id })}>Remover</Button>
              </li>
            ))}
          </ul>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => dispatch({ type: "add", entidade: "engenheiros", item: { id: uid(), nome: "Novo engenheiro", pix: "" } })}>
            Adicionar engenheiro
          </Button>
        </Card>

        {GRUPOS.map((g) => {
          const valores = state.listas[g.chave];
          return (
            <Card key={g.chave}>
              <p className="label-caps mb-4">{g.titulo}</p>
              <ul className="flex flex-wrap gap-2">
                {valores.map((v) => (
                  <li key={v} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
                    {v}
                    <button
                      aria-label={`Remover ${v}`}
                      className="text-muted-foreground hover:text-negative"
                      onClick={() => setLista(g.chave, valores.filter((x) => x !== v))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <TextInput
                  className="h-9"
                  placeholder="Novo valor"
                  value={novos[g.chave] ?? ""}
                  onChange={(e) => setNovos({ ...novos, [g.chave]: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const v = (novos[g.chave] ?? "").trim();
                    if (!v) {
                      toast.error("Informe um valor.");
                      return;
                    }
                    setLista(g.chave, [...valores, v]);
                    setNovos({ ...novos, [g.chave]: "" });
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}