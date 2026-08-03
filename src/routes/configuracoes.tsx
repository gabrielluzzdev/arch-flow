import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Database, Download, Eraser } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/primitives";
import { Field, SelectInput, TextInput } from "@/components/common/fields";
import { todayISO, uid } from "@/lib/format";
import { baixarArquivo, paraCSV, parseCSV } from "@/lib/csv";
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
  { chave: "responsaveis", titulo: "Responsáveis do escritório" },
];

type TipoImportacao = "lancamentos" | "clientes";

const MODELOS: Record<TipoImportacao, { headers: string[]; exemplo: string[] }> = {
  lancamentos: {
    headers: ["Data", "P/E", "Categoria", "Descrição", "Entrada", "Saída", "Forma", "Conta"],
    exemplo: ["01/03/2026", "Empresa", "Honorários", "Exemplo de lançamento", "1000,00", "", "Pix", "Caixa Econômica (PJ)"],
  },
  clientes: {
    headers: ["Código", "Nome", "Documento", "Tipo de Projeto", "Endereço", "Nº Contrato", "Data Inicial", "Etapa", "Responsável"],
    exemplo: ["LB2601", "Cliente Exemplo", "000.000.000-00", "Residencial Unifamiliar", "Rua Exemplo, 123", "CT-001", "01/03/2026", "Lead", "Luz Botelho"],
  },
};

const DIACRITICOS = /[̀-ͯ]/g;
const normalizar = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(DIACRITICOS, "");

const parseDataFlexivel = (s: string) => {
  const v = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return todayISO();
};

const parseValor = (s: string) => {
  if (!s) return 0;
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
};

function Configuracoes() {
  const state = useApp();
  const dispatch = useDispatch();
  const [novos, setNovos] = useState<Record<string, string>>({});
  const [tipoImport, setTipoImport] = useState<TipoImportacao>("lancamentos");
  const [linhasImport, setLinhasImport] = useState<string[][] | null>(null);
  const [arquivoNome, setArquivoNome] = useState("");

  const setLista = (chave: keyof Listas, valores: string[]) =>
    dispatch({ type: "setListas", listas: { [chave]: valores } as Partial<Listas> });

  const baixarModelo = () => {
    const m = MODELOS[tipoImport];
    baixarArquivo(`modelo-${tipoImport}.csv`, paraCSV([m.headers, m.exemplo]));
  };

  const onArquivoSelecionado = async (file: File) => {
    const texto = await file.text();
    const linhas = parseCSV(texto);
    if (linhas.length < 2) {
      toast.error("Arquivo vazio ou sem linhas de dados.");
      return;
    }
    setArquivoNome(file.name);
    setLinhasImport(linhas);
  };

  const confirmarImportacao = () => {
    if (!linhasImport) return;
    const [header, ...linhas] = linhasImport;
    const idx = (nome: string) => header!.findIndex((h) => normalizar(h) === normalizar(nome));
    let importados = 0;

    if (tipoImport === "lancamentos") {
      const iData = idx("Data");
      const iPE = idx("P/E");
      const iCat = idx("Categoria");
      const iDesc = idx("Descrição");
      const iEnt = idx("Entrada");
      const iSai = idx("Saída");
      const iForma = idx("Forma");
      const iConta = idx("Conta");
      for (const l of linhas) {
        const descricao = l[iDesc]?.trim();
        if (!descricao) continue;
        dispatch({
          type: "add",
          entidade: "lancamentos",
          item: {
            id: uid(),
            data: parseDataFlexivel(l[iData] ?? ""),
            pe: l[iPE]?.trim() === "Pessoal" ? "Pessoal" : "Empresa",
            categoria: l[iCat]?.trim() ?? "",
            descricao,
            entrada: parseValor(l[iEnt] ?? ""),
            saida: parseValor(l[iSai] ?? ""),
            ...(l[iForma]?.trim() ? { forma: l[iForma]!.trim() } : {}),
            ...(l[iConta]?.trim() ? { conta: l[iConta]!.trim() } : {}),
          },
        });
        importados++;
      }
    } else {
      const iCod = idx("Código");
      const iNome = idx("Nome");
      const iDoc = idx("Documento");
      const iTipo = idx("Tipo de Projeto");
      const iEnd = idx("Endereço");
      const iContrato = idx("Nº Contrato");
      const iDataI = idx("Data Inicial");
      const iEtapa = idx("Etapa");
      const iResp = idx("Responsável");
      for (const l of linhas) {
        const nome = l[iNome]?.trim();
        if (!nome) continue;
        dispatch({
          type: "add",
          entidade: "clientes",
          item: {
            id: uid(),
            codigo:
              l[iCod]?.trim() ||
              `LB${String(new Date().getFullYear()).slice(2)}${String(state.clientes.length + importados + 1).padStart(2, "0")}`,
            nome,
            documento: l[iDoc]?.trim() ?? "",
            tipoProjeto: l[iTipo]?.trim() || (state.listas.tiposProjeto[0] ?? ""),
            endereco: l[iEnd]?.trim() ?? "",
            numeroContrato: l[iContrato]?.trim() ?? "",
            dataInicial: parseDataFlexivel(l[iDataI] ?? ""),
            etapa: l[iEtapa]?.trim() || (state.listas.etapas[0] ?? ""),
            ...(l[iResp]?.trim() ? { responsavel: l[iResp]!.trim() } : {}),
          },
        });
        importados++;
      }
    }

    toast.success(`${importados} registro(s) importado(s).`);
    setLinhasImport(null);
    setArquivoNome("");
  };

  return (
    <AppShell title="Configurações">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="label-caps mb-4">Parâmetros do ano</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ano"><TextInput type="number" value={state.ano} onChange={(e) => dispatch({ type: "setAno", ano: Number(e.target.value) })} /></Field>
            <Field label="Saldo inicial do ano"><TextInput type="number" value={state.saldoInicial} onChange={(e) => dispatch({ type: "setSaldoInicial", valor: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
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

        <Card className="lg:col-span-2">
          <p className="label-caps mb-1">Importar dados (CSV)</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Traga clientes ou lançamentos de uma planilha. Baixe o modelo, preencha no Excel/Sheets e envie de volta.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="O que importar">
              <SelectInput
                className="w-48"
                options={[
                  { value: "lancamentos", label: "Lançamentos" },
                  { value: "clientes", label: "Clientes" },
                ]}
                value={tipoImport}
                onChange={(e) => {
                  setTipoImport(e.target.value as TipoImportacao);
                  setLinhasImport(null);
                  setArquivoNome("");
                }}
              />
            </Field>
            <Button variant="outline" size="sm" onClick={baixarModelo}>
              <Download className="h-4 w-4" strokeWidth={1.5} /> Baixar modelo
            </Button>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onArquivoSelecionado(file);
              e.target.value = "";
            }}
            className="mt-4 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:text-foreground"
          />
          {linhasImport ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {arquivoNome} — {linhasImport.length - 1} linha(s) encontrada(s).
              </p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {linhasImport[0]!.map((h, i) => (
                        <th key={i} className="whitespace-nowrap px-2 py-1.5 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhasImport.slice(1, 6).map((l, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {l.map((c, j) => (
                          <td key={j} className="whitespace-nowrap px-2 py-1.5">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {linhasImport.length - 1 > 5 ? (
                <p className="mt-1 text-xs text-muted-foreground">Mostrando 5 de {linhasImport.length - 1} linhas.</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={confirmarImportacao}>Confirmar importação</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLinhasImport(null);
                    setArquivoNome("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
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
