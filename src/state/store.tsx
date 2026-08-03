import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type {
  AppState,
  Cliente,
  ContaFixa,
  Engenheiro,
  ImpostoNF,
  Lancamento,
  Listas,
  Parcela,
  Proposta,
  Reembolsavel,
  Repasse,
  Servico,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { estadoVazio } from "./initial";
import { dadosExemplo } from "./seed";

type Entidade =
  | "clientes"
  | "servicos"
  | "parcelas"
  | "reembolsaveis"
  | "impostos"
  | "repasses"
  | "lancamentos"
  | "contasFixas"
  | "propostas"
  | "engenheiros";

type Registro =
  | Cliente
  | Servico
  | Parcela
  | Reembolsavel
  | ImpostoNF
  | Repasse
  | Lancamento
  | ContaFixa
  | Proposta
  | Engenheiro;

// Mapeia cada entidade do AppState para a tabela correspondente no Supabase.
const TABELAS: Record<Entidade, string> = {
  clientes: "clientes",
  servicos: "servicos",
  parcelas: "parcelas",
  reembolsaveis: "reembolsaveis",
  impostos: "impostos_nf",
  repasses: "repasses_eng",
  lancamentos: "lancamentos",
  contasFixas: "contas_fixas",
  propostas: "propostas",
  engenheiros: "engenheiros",
};

// Ordem de limpeza: dependentes de "clientes" antes, "clientes" por último.
const TABELAS_DOMINIO = [
  "repasses_eng",
  "impostos_nf",
  "reembolsaveis",
  "parcelas",
  "servicos",
  "propostas",
  "lancamentos",
  "contas_fixas",
  "clientes",
] as const;

export type Action =
  | { type: "add"; entidade: Entidade; item: Registro }
  | { type: "update"; entidade: Entidade; id: string; patch: Record<string, unknown> }
  | { type: "remove"; entidade: Entidade; id: string }
  | { type: "setListas"; listas: Partial<Listas> }
  | { type: "setAno"; ano: number }
  | { type: "setSaldoInicial"; valor: number }
  | { type: "seed" }
  | { type: "reset" }
  | { type: "hydrate"; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "add":
      return {
        ...state,
        [action.entidade]: [...(state[action.entidade] as Registro[]), action.item],
      };
    case "update":
      return {
        ...state,
        [action.entidade]: (state[action.entidade] as Registro[]).map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r,
        ),
      };
    case "remove":
      return {
        ...state,
        [action.entidade]: (state[action.entidade] as Registro[]).filter(
          (r) => r.id !== action.id,
        ),
      };
    case "setListas":
      return { ...state, listas: { ...state.listas, ...action.listas } };
    case "setAno":
      return { ...state, ano: action.ano };
    case "setSaldoInicial":
      return { ...state, saldoInicial: action.valor };
    case "seed":
      return dadosExemplo();
    case "reset":
      return estadoVazio();
    case "hydrate":
      return action.state;
    default:
      return state;
  }
}

async function carregarEstado(): Promise<AppState> {
  const [
    clientes,
    servicos,
    parcelas,
    reembolsaveis,
    impostos,
    repasses,
    lancamentos,
    contasFixas,
    propostas,
    engenheiros,
    listasRows,
    config,
  ] = await Promise.all([
    supabase.from("clientes").select("*").order("codigo"),
    supabase.from("servicos").select("*"),
    supabase.from("parcelas").select("*"),
    supabase.from("reembolsaveis").select("*"),
    supabase.from("impostos_nf").select("*"),
    supabase.from("repasses_eng").select("*"),
    supabase.from("lancamentos").select("*").order("data"),
    supabase.from("contas_fixas").select("*"),
    supabase.from("propostas").select("*"),
    supabase.from("engenheiros").select("*"),
    supabase.from("listas").select("*").order("ordem"),
    supabase.from("app_config").select("*").eq("id", 1).maybeSingle(),
  ]);

  for (const r of [
    clientes,
    servicos,
    parcelas,
    reembolsaveis,
    impostos,
    repasses,
    lancamentos,
    contasFixas,
    propostas,
    engenheiros,
    listasRows,
    config,
  ]) {
    if (r.error) throw r.error;
  }

  const listasVazias: Listas = {
    categorias: [],
    formas: [],
    contas: [],
    gruposContaFixa: [],
    tiposProjeto: [],
    categoriasServico: [],
    etapas: [],
    responsaveis: [],
  };
  for (const row of listasRows.data ?? []) {
    const chave = row.chave as keyof Listas;
    if (listasVazias[chave]) listasVazias[chave].push(row.valor as string);
  }

  return {
    clientes: (clientes.data ?? []) as Cliente[],
    servicos: (servicos.data ?? []) as Servico[],
    parcelas: (parcelas.data ?? []) as Parcela[],
    reembolsaveis: (reembolsaveis.data ?? []) as Reembolsavel[],
    impostos: (impostos.data ?? []) as ImpostoNF[],
    repasses: (repasses.data ?? []) as Repasse[],
    lancamentos: (lancamentos.data ?? []) as Lancamento[],
    contasFixas: (contasFixas.data ?? []).map((c: ContaFixa) => ({
      ...c,
      meses: c.meses ?? Array(12).fill(0),
    })),
    propostas: (propostas.data ?? []) as Proposta[],
    engenheiros: (engenheiros.data ?? []) as Engenheiro[],
    listas: listasVazias,
    ano: (config.data?.ano as number | undefined) ?? new Date().getFullYear(),
    saldoInicial: (config.data?.saldoInicial as number | undefined) ?? 0,
  };
}

async function limparDominio() {
  for (const tabela of TABELAS_DOMINIO) {
    const { error } = await supabase.from(tabela).delete().not("id", "is", null);
    if (error) throw error;
  }
}

async function inserir(tabela: string, linhas: unknown[]) {
  if (!linhas.length) return;
  const { error } = await supabase.from(tabela).insert(linhas);
  if (error) throw error;
}

async function semearSupabase() {
  const dados = dadosExemplo();
  await limparDominio();
  await inserir("clientes", dados.clientes);
  await Promise.all([
    inserir("servicos", dados.servicos),
    inserir("parcelas", dados.parcelas),
    inserir("reembolsaveis", dados.reembolsaveis),
    inserir("impostos_nf", dados.impostos),
    inserir("repasses_eng", dados.repasses),
    inserir("lancamentos", dados.lancamentos),
    inserir("propostas", dados.propostas),
    inserir("contas_fixas", dados.contasFixas),
  ]);
  const { error } = await supabase
    .from("app_config")
    .update({ ano: dados.ano, saldoInicial: dados.saldoInicial })
    .eq("id", 1);
  if (error) throw error;
}

async function resetarSupabase() {
  await limparDominio();
  const vazio = estadoVazio();

  const { error: eListasDel } = await supabase.from("listas").delete().not("id", "is", null);
  if (eListasDel) throw eListasDel;
  const linhasListas = (Object.entries(vazio.listas) as [string, string[]][]).flatMap(
    ([chave, valores]) => valores.map((valor, ordem) => ({ chave, valor, ordem })),
  );
  await inserir("listas", linhasListas);

  const { error: eEngDel } = await supabase.from("engenheiros").delete().not("id", "is", null);
  if (eEngDel) throw eEngDel;
  await inserir("engenheiros", vazio.engenheiros);

  const { error: eConfig } = await supabase
    .from("app_config")
    .update({ ano: vazio.ano, saldoInicial: vazio.saldoInicial })
    .eq("id", 1);
  if (eConfig) throw eConfig;
}

async function persistir(action: Action, estadoAnterior: AppState) {
  switch (action.type) {
    case "add": {
      // Sem tipos gerados do Supabase: o payload já bate 1:1 com as colunas da tabela.
      const { error } = await supabase.from(TABELAS[action.entidade]).insert(action.item as never);
      if (error) throw error;
      return;
    }
    case "update": {
      const { error } = await supabase
        .from(TABELAS[action.entidade])
        .update(action.patch as never)
        .eq("id", action.id);
      if (error) throw error;
      return;
    }
    case "remove": {
      const { error } = await supabase.from(TABELAS[action.entidade]).delete().eq("id", action.id);
      if (error) throw error;
      return;
    }
    case "setListas": {
      for (const [chave, valores] of Object.entries(action.listas) as [keyof Listas, string[]][]) {
        const antigos = estadoAnterior.listas[chave];
        const removidos = antigos.filter((v) => !valores.includes(v));
        const adicionados = valores.filter((v) => !antigos.includes(v));
        if (removidos.length) {
          const { error } = await supabase
            .from("listas")
            .delete()
            .eq("chave", chave)
            .in("valor", removidos);
          if (error) throw error;
        }
        if (adicionados.length) {
          await inserir(
            "listas",
            adicionados.map((valor, i) => ({ chave, valor, ordem: antigos.length + i })),
          );
        }
      }
      return;
    }
    case "setAno": {
      const { error } = await supabase.from("app_config").update({ ano: action.ano }).eq("id", 1);
      if (error) throw error;
      return;
    }
    case "setSaldoInicial": {
      const { error } = await supabase
        .from("app_config")
        .update({ saldoInicial: action.valor })
        .eq("id", 1);
      if (error) throw error;
      return;
    }
    case "seed":
      await semearSupabase();
      return;
    case "reset":
      await resetarSupabase();
      return;
    case "hydrate":
      return;
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: (action: Action) => void } | null>(
  null,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, estadoVazio);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelado = false;
    carregarEstado()
      .then((carregado) => {
        if (cancelado) return;
        rawDispatch({ type: "hydrate", state: carregado });
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Não foi possível carregar os dados do Supabase.");
        setReady(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const dispatch = (action: Action) => {
    const anterior = stateRef.current;
    rawDispatch(action);
    persistir(action, anterior).catch((err) => {
      console.error(err);
      toast.error("Falha ao salvar no Supabase. Tente novamente.");
    });
  };

  const value = useMemo(() => ({ state, dispatch }), [state]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}

export const useApp = () => useStore().state;
export const useDispatch = () => useStore().dispatch;
