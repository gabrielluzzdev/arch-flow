import type { AppState, Cliente, Parcela, Repasse } from "./types";
import { todayISO } from "./format";

export const servicoTotal = (area: number, valorM2: number) => (area || 0) * (valorM2 || 0);

export function clienteTotais(state: AppState, clienteId: string) {
  const servicos = state.servicos.filter((s) => s.clienteId === clienteId);
  const honorarios = servicos
    .filter((s) => s.categoria === "Honorários")
    .reduce((a, s) => a + servicoTotal(s.area, s.valorM2), 0);
  const aditivo = servicos
    .filter((s) => s.categoria === "Aditivo")
    .reduce((a, s) => a + servicoTotal(s.area, s.valorM2), 0);
  const engenharia = servicos
    .filter((s) => s.categoria === "Engenharia")
    .reduce((a, s) => a + servicoTotal(s.area, s.valorM2), 0);
  const total = honorarios + aditivo;
  const totalPago = state.parcelas
    .filter((p) => p.clienteId === clienteId)
    .reduce((a, p) => a + (p.valorPago ?? 0), 0);
  return { honorarios, aditivo, engenharia, total, totalPago, saldo: total - totalPago };
}

export type ParcelaStatus = "Pago" | "A vencer" | "Vencido";

export function parcelaStatus(p: Parcela): ParcelaStatus {
  if (p.dataPagamento) return "Pago";
  return p.vencimento && p.vencimento < todayISO() ? "Vencido" : "A vencer";
}

export const repasseStatus = (r: Repasse) => (r.dataPagamento ? "Pago" : "Pendente");

export function pixDoEngenheiro(state: AppState, engenheiroId: string) {
  return state.engenheiros.find((e) => e.id === engenheiroId)?.pix ?? "—";
}

export function nomeCliente(state: AppState, clienteId?: string) {
  return state.clientes.find((c) => c.id === clienteId)?.nome ?? "—";
}

export interface ResumoMes {
  mes: number;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
  acumulado: number;
  entradasEmpresa: number;
  saidasEmpresa: number;
  entradasPessoal: number;
  saidasPessoal: number;
  recebidoClientes: number;
}

export function resumoMensal(state: AppState): ResumoMes[] {
  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  let acumulado = state.saldoInicial;
  return labels.map((label, i) => {
    const doMes = state.lancamentos.filter(
      (l) => Number(l.data.slice(0, 4)) === state.ano && Number(l.data.slice(5, 7)) === i + 1,
    );
    const sum = (arr: typeof doMes, k: "entrada" | "saida") =>
      arr.reduce((a, l) => a + (l[k] || 0), 0);
    const empresa = doMes.filter((l) => l.pe === "Empresa");
    const pessoal = doMes.filter((l) => l.pe === "Pessoal");
    const entradas = sum(doMes, "entrada");
    const saidas = sum(doMes, "saida");
    acumulado += entradas - saidas;
    return {
      mes: i + 1,
      label,
      entradas,
      saidas,
      saldo: entradas - saidas,
      acumulado,
      entradasEmpresa: sum(empresa, "entrada"),
      saidasEmpresa: sum(empresa, "saida"),
      entradasPessoal: sum(pessoal, "entrada"),
      saidasPessoal: sum(pessoal, "saida"),
      recebidoClientes: doMes
        .filter((l) => l.categoria === "Honorários" || !!l.clienteId)
        .reduce((a, l) => a + (l.entrada || 0), 0),
    };
  });
}

export interface Rentabilidade {
  cliente: Cliente;
  recebido: number;
  reembolsaveis: number;
  engenharia: number;
  impostos: number;
  custasFixas: number;
  resultado: number;
  margem: number;
}

export function rentabilidade(state: AppState): Rentabilidade[] {
  return state.clientes.map((cliente) => {
    const recebido = clienteTotais(state, cliente.id).totalPago;
    const reembolsaveis = state.reembolsaveis
      .filter((r) => r.clienteId === cliente.id)
      .reduce((a, r) => a + r.valor, 0);
    const engenharia = state.repasses
      .filter((r) => r.clienteId === cliente.id)
      .reduce((a, r) => a + r.valor, 0);
    const impostos = state.impostos
      .filter((r) => r.clienteId === cliente.id)
      .reduce((a, r) => a + r.valor, 0);
    const custasFixas = cliente.custasFixas ?? 0;
    const resultado = recebido - reembolsaveis - engenharia - impostos - custasFixas;
    return {
      cliente,
      recebido,
      reembolsaveis,
      engenharia,
      impostos,
      custasFixas,
      resultado,
      margem: recebido > 0 ? resultado / recebido : 0,
    };
  });
}

export const contaFixaTotal = (meses: number[]) => meses.reduce((a, b) => a + (b || 0), 0);
export const contaFixaMedia = (meses: number[]) => contaFixaTotal(meses) / 12;

export const propostaTotais = (itens: { qtd: number; valorUnit: number }[], desconto: number) => {
  const subtotal = itens.reduce((a, i) => a + (i.qtd || 0) * (i.valorUnit || 0), 0);
  return { subtotal, total: Math.max(0, subtotal - (desconto || 0)) };
};