export type PE = "Empresa" | "Pessoal";
export type CategoriaServico = "Honorários" | "Aditivo" | "Engenharia";

export interface Cliente {
  id: string;
  codigo: string;
  nome: string;
  documento: string;
  tipoProjeto: string;
  endereco: string;
  numeroContrato: string;
  dataInicial: string;
  imagem?: string;
  etapa: string;
  responsavel?: string;
  notas?: string;
  custasFixas?: number;
}

export interface Servico {
  id: string;
  clienteId: string;
  descricao: string;
  categoria: CategoriaServico;
  responsavel?: string;
  area: number;
  valorM2: number;
}

export interface Parcela {
  id: string;
  clienteId: string;
  parcela: string;
  vencimento: string;
  valor: number;
  dataPagamento?: string;
  forma?: string;
  valorPago?: number;
  nf?: string;
}

export interface Reembolsavel {
  id: string;
  clienteId: string;
  data: string;
  descricao: string;
  recibo?: string;
  valor: number;
  dataPagamento?: string;
}

export interface ImpostoNF {
  id: string;
  clienteId: string;
  data: string;
  descricao: string;
  nf?: string;
  valor: number;
  dataPagamento?: string;
}

export interface Repasse {
  id: string;
  clienteId: string;
  engenheiroId: string;
  parcela: string;
  marco: string;
  valor: number;
  dataPagamento?: string;
}

export interface Lancamento {
  id: string;
  data: string;
  pe: PE;
  categoria: string;
  descricao: string;
  entrada: number;
  saida: number;
  forma?: string;
  conta?: string;
  obs?: string;
  clienteId?: string;
}

export interface ContaFixa {
  id: string;
  grupo: string;
  dia: number;
  descricao: string;
  forma?: string;
  meses: number[];
}

export interface PropostaItem {
  id: string;
  descricao: string;
  qtd: number;
  valorUnit: number;
}

export type PropostaStatus = "Rascunho" | "Enviada" | "Aceita" | "Recusada";

export interface Proposta {
  id: string;
  clienteId?: string;
  clienteNome: string;
  titulo: string;
  escopo: string;
  itens: PropostaItem[];
  desconto: number;
  condicoes: string;
  validade: string;
  status: PropostaStatus;
  criadaEm: string;
}

export interface Engenheiro {
  id: string;
  nome: string;
  pix: string;
}

export type TarefaStatus = "A fazer" | "Em andamento" | "Concluída";

export interface Tarefa {
  id: string;
  clienteId: string;
  titulo: string;
  status: TarefaStatus;
  responsavel?: string;
  prazo?: string;
  criadaEm: string;
}

export interface Listas {
  categorias: string[];
  formas: string[];
  contas: string[];
  gruposContaFixa: string[];
  tiposProjeto: string[];
  categoriasServico: string[];
  etapas: string[];
  responsaveis: string[];
}

export interface AppState {
  clientes: Cliente[];
  servicos: Servico[];
  parcelas: Parcela[];
  reembolsaveis: Reembolsavel[];
  impostos: ImpostoNF[];
  repasses: Repasse[];
  lancamentos: Lancamento[];
  contasFixas: ContaFixa[];
  propostas: Proposta[];
  engenheiros: Engenheiro[];
  tarefas: Tarefa[];
  listas: Listas;
  ano: number;
  saldoInicial: number;
}