import type { AppState } from "@/lib/types";
import { estadoVazio } from "./initial";

const ANO = new Date().getFullYear();
const d = (m: number, dia: number) =>
  `${ANO}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

export function dadosExemplo(): AppState {
  const base = estadoVazio();
  base.saldoInicial = 42000;
  base.ano = ANO;

  base.clientes = [
    {
      id: "c1",
      codigo: `LB${String(ANO).slice(2)}01`,
      nome: "Residência Marina Alves",
      documento: "123.456.789-00",
      tipoProjeto: "Residencial Unifamiliar",
      endereco: "Rua das Acácias, 240 — Jardim Europa",
      numeroContrato: "CT-014",
      dataInicial: d(2, 12),
      etapa: "Contrato ativo",
      responsavel: "Luz Botelho",
      custasFixas: 4200,
    },
    {
      id: "c2",
      codigo: `LB${String(ANO).slice(2)}02`,
      nome: "Escritório Vértice",
      documento: "22.333.444/0001-55",
      tipoProjeto: "Comercial",
      endereco: "Av. Paulista, 1800 — cj. 92",
      numeroContrato: "CT-015",
      dataInicial: d(3, 3),
      etapa: "Contrato ativo",
      responsavel: "Luz Botelho",
      custasFixas: 3100,
    },
    {
      id: "c3",
      codigo: `LB${String(ANO).slice(2)}03`,
      nome: "Apartamento Ravelli",
      documento: "987.654.321-00",
      tipoProjeto: "Interiores",
      endereco: "Rua Bela Cintra, 77 — ap. 121",
      numeroContrato: "CT-016",
      dataInicial: d(4, 22),
      etapa: "Proposta enviada",
      responsavel: "Luz Botelho",
    },
    {
      id: "c4",
      codigo: `LB${String(ANO).slice(2)}04`,
      nome: "Casa Pedra Branca",
      documento: "555.222.111-33",
      tipoProjeto: "Reforma",
      endereco: "Estrada da Serra, km 4",
      numeroContrato: "CT-017",
      dataInicial: d(5, 9),
      etapa: "Em contato",
    },
    {
      id: "c5",
      codigo: `LB${String(ANO).slice(2)}05`,
      nome: "Edifício Lumina",
      documento: "44.555.666/0001-77",
      tipoProjeto: "Residencial Multifamiliar",
      endereco: "Rua Harmonia, 900",
      numeroContrato: "CT-018",
      dataInicial: d(6, 1),
      etapa: "Lead",
    },
    {
      id: "c6",
      codigo: `LB${String(ANO).slice(2)}06`,
      nome: "Loft Higienópolis",
      documento: "111.222.333-44",
      tipoProjeto: "Interiores",
      endereco: "Rua Maranhão, 310",
      numeroContrato: "CT-013",
      dataInicial: d(1, 15),
      etapa: "Concluído",
      custasFixas: 1800,
    },
  ];

  base.servicos = [
    {
      id: "s1",
      clienteId: "c1",
      descricao: "Projeto arquitetônico completo",
      categoria: "Honorários",
      area: 320,
      valorM2: 260,
    },
    {
      id: "s2",
      clienteId: "c1",
      descricao: "Detalhamento de marcenaria",
      categoria: "Aditivo",
      area: 40,
      valorM2: 320,
    },
    {
      id: "s3",
      clienteId: "c1",
      descricao: "Projeto estrutural",
      categoria: "Engenharia",
      responsavel: "eng1",
      area: 320,
      valorM2: 45,
    },
    {
      id: "s4",
      clienteId: "c2",
      descricao: "Projeto corporativo",
      categoria: "Honorários",
      area: 210,
      valorM2: 240,
    },
    {
      id: "s5",
      clienteId: "c2",
      descricao: "Projeto elétrico",
      categoria: "Engenharia",
      responsavel: "eng2",
      area: 210,
      valorM2: 38,
    },
    {
      id: "s6",
      clienteId: "c3",
      descricao: "Interiores e mobiliário",
      categoria: "Honorários",
      area: 130,
      valorM2: 290,
    },
    {
      id: "s7",
      clienteId: "c6",
      descricao: "Reforma de interiores",
      categoria: "Honorários",
      area: 95,
      valorM2: 280,
    },
  ];

  base.parcelas = [
    {
      id: "p1",
      clienteId: "c1",
      parcela: "1/4",
      vencimento: d(2, 20),
      valor: 24500,
      dataPagamento: d(2, 20),
      forma: "Pix",
      valorPago: 24500,
      nf: "0141",
    },
    {
      id: "p2",
      clienteId: "c1",
      parcela: "2/4",
      vencimento: d(4, 20),
      valor: 24500,
      dataPagamento: d(4, 22),
      forma: "TED",
      valorPago: 24500,
      nf: "0148",
    },
    { id: "p3", clienteId: "c1", parcela: "3/4", vencimento: d(6, 20), valor: 24500 },
    { id: "p4", clienteId: "c1", parcela: "4/4", vencimento: d(8, 20), valor: 21300 },
    {
      id: "p5",
      clienteId: "c2",
      parcela: "1/3",
      vencimento: d(3, 10),
      valor: 16800,
      dataPagamento: d(3, 11),
      forma: "Pix",
      valorPago: 16800,
      nf: "0143",
    },
    { id: "p6", clienteId: "c2", parcela: "2/3", vencimento: d(5, 10), valor: 16800 },
    { id: "p7", clienteId: "c2", parcela: "3/3", vencimento: d(7, 10), valor: 16800 },
    {
      id: "p8",
      clienteId: "c6",
      parcela: "1/1",
      vencimento: d(1, 30),
      valor: 26600,
      dataPagamento: d(1, 30),
      forma: "Boleto",
      valorPago: 26600,
      nf: "0139",
    },
  ];

  base.reembolsaveis = [
    {
      id: "r1",
      clienteId: "c1",
      data: d(3, 8),
      descricao: "Plotagem de pranchas A1",
      recibo: "RC-221",
      valor: 480,
      dataPagamento: d(3, 9),
    },
    {
      id: "r2",
      clienteId: "c2",
      data: d(4, 2),
      descricao: "Taxas de aprovação municipal",
      recibo: "RC-230",
      valor: 1250,
    },
  ];

  base.impostos = [
    {
      id: "i1",
      clienteId: "c1",
      data: d(2, 25),
      descricao: "ISS s/ NF 0141",
      nf: "0141",
      valor: 1225,
      dataPagamento: d(3, 5),
    },
    { id: "i2", clienteId: "c2", data: d(3, 15), descricao: "ISS s/ NF 0143", nf: "0143", valor: 840 },
  ];

  base.repasses = [
    {
      id: "rp1",
      clienteId: "c1",
      engenheiroId: "eng1",
      parcela: "1/2",
      marco: "Entrega estrutural",
      valor: 7200,
      dataPagamento: d(4, 12),
    },
    {
      id: "rp2",
      clienteId: "c1",
      engenheiroId: "eng1",
      parcela: "2/2",
      marco: "Compatibilização",
      valor: 7200,
    },
    {
      id: "rp3",
      clienteId: "c2",
      engenheiroId: "eng2",
      parcela: "1/1",
      marco: "Projeto elétrico",
      valor: 7980,
    },
  ];

  const lanc: AppState["lancamentos"] = [];
  const push = (
    data: string,
    pe: "Empresa" | "Pessoal",
    categoria: string,
    descricao: string,
    entrada: number,
    saida: number,
    conta: string,
    clienteId?: string,
  ) =>
    lanc.push({
      id: `l${lanc.length + 1}`,
      data,
      pe,
      categoria,
      descricao,
      entrada,
      saida,
      forma: entrada > 0 ? "Pix" : "Boleto",
      conta,
      ...(clienteId ? { clienteId } : {}),
    });

  push(d(1, 30), "Empresa", "Honorários", "Loft Higienópolis — parcela única", 26600, 0, "Caixa Econômica (PJ)", "c6");
  push(d(2, 20), "Empresa", "Honorários", "Residência Marina — parcela 1/4", 24500, 0, "Caixa Econômica (PJ)", "c1");
  push(d(3, 11), "Empresa", "Honorários", "Escritório Vértice — parcela 1/3", 16800, 0, "PagBank (PJ)", "c2");
  push(d(4, 22), "Empresa", "Honorários", "Residência Marina — parcela 2/4", 24500, 0, "Caixa Econômica (PJ)", "c1");
  for (let m = 1; m <= 6; m++) {
    push(d(m, 5), "Empresa", "Aluguel", "Aluguel do escritório", 0, 3800, "Caixa Econômica (PJ)");
    push(d(m, 8), "Empresa", "Salário/Estágio", "Estágio de arquitetura", 0, 1800, "Caixa Econômica (PJ)");
    push(d(m, 12), "Empresa", "Internet", "Internet e telefonia", 0, 320, "PagBank (PJ)");
    push(d(m, 15), "Pessoal", "Plano de Saúde", "Plano de saúde", 0, 1180, "Banco do Brasil (PF)");
    push(d(m, 18), "Pessoal", "Cartão Crédito", "Fatura cartão", 0, 3400, "Santander (PF)");
    push(d(m, 20), "Pessoal", "Colégio", "Mensalidade escolar", 0, 2200, "Bradesco (PF)");
  }
  push(d(4, 12), "Empresa", "Engenharia", "Repasse Polatti — 1/2", 0, 7200, "Caixa Econômica (PJ)", "c1");
  push(d(3, 9), "Empresa", "Plotagem", "Plotagem A1 — Marina", 0, 480, "PagBank (PJ)", "c1");
  push(d(3, 5), "Empresa", "Imposto", "ISS NF 0141", 0, 1225, "Caixa Econômica (PJ)", "c1");
  base.lancamentos = lanc;

  base.contasFixas = [
    {
      id: "cf1",
      grupo: "Escritório",
      dia: 5,
      descricao: "Aluguel do escritório",
      forma: "Boleto",
      meses: Array.from({ length: 12 }, (_, i) => (i < 6 ? 3800 : 0)),
    },
    {
      id: "cf2",
      grupo: "Escritório",
      dia: 12,
      descricao: "Internet e telefonia",
      forma: "DA",
      meses: Array.from({ length: 12 }, (_, i) => (i < 6 ? 320 : 0)),
    },
    {
      id: "cf3",
      grupo: "Engenharia/Render",
      dia: 10,
      descricao: "Assinatura de render 3D",
      forma: "Cartão",
      meses: Array.from({ length: 12 }, (_, i) => (i < 6 ? 490 : 0)),
    },
    {
      id: "cf4",
      grupo: "Pessoal",
      dia: 15,
      descricao: "Plano de saúde",
      forma: "DA",
      meses: Array.from({ length: 12 }, (_, i) => (i < 6 ? 1180 : 0)),
    },
  ];

  base.propostas = [
    {
      id: "pr1",
      clienteId: "c3",
      clienteNome: "Apartamento Ravelli",
      titulo: "Projeto de interiores — Ravelli",
      escopo: "Levantamento, layout, detalhamento de marcenaria e acompanhamento de obra.",
      itens: [
        { id: "it1", descricao: "Projeto de interiores", qtd: 130, valorUnit: 290 },
        { id: "it2", descricao: "Acompanhamento de obra (visitas)", qtd: 6, valorUnit: 850 },
      ],
      desconto: 2000,
      condicoes: "30% na assinatura, 3 parcelas mensais iguais.",
      validade: d(7, 30),
      status: "Enviada",
      criadaEm: d(4, 22),
    },
    {
      id: "pr2",
      clienteId: "c5",
      clienteNome: "Edifício Lumina",
      titulo: "Estudo preliminar — Lumina",
      escopo: "Estudo de massa e viabilidade para edifício de 12 unidades.",
      itens: [{ id: "it3", descricao: "Estudo preliminar", qtd: 1, valorUnit: 18000 }],
      desconto: 0,
      condicoes: "50% na assinatura, 50% na entrega.",
      validade: d(8, 15),
      status: "Rascunho",
      criadaEm: d(6, 2),
    },
  ];

  return base;
}