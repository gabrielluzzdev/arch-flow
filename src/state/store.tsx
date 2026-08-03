import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
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

export type Action =
  | { type: "add"; entidade: Entidade; item: Registro }
  | { type: "update"; entidade: Entidade; id: string; patch: Record<string, unknown> }
  | { type: "remove"; entidade: Entidade; id: string }
  | { type: "setListas"; listas: Partial<Listas> }
  | { type: "setAno"; ano: number }
  | { type: "setSaldoInicial"; valor: number }
  | { type: "seed" }
  | { type: "reset" };

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
    default:
      return state;
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(
  null,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, estadoVazio);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}

export const useApp = () => useStore().state;
export const useDispatch = () => useStore().dispatch;