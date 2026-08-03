# Arch Flow

# Luz Botelho Arquitetura — Sistema de Gestão (Financeiro + CRM)

## Contexto
Sistema web de gestão para o escritório de arquitetura Luz Botelho Arquitetura — a versão em software da planilha financeira unificada do escritório. Une controle financeiro completo (empresa + pessoal) e CRM de clientes/contratos. Idioma: Português (Brasil). Estética minimalista, sofisticada, "editorial de arquitetura": muito respiro, tipografia elegante, poucos elementos. SEM EMOJIS em lugar nenhum — usar apenas ícones de linha (Lucide) e o símbolo R$ nos valores.

Convenção visual: campos EDITÁVEIS aparecem destacados (borda/realce sutil em azul-acinzentado); campos CALCULADOS são somente-leitura, discretos. O usuário nunca edita um campo calculado.

## Stack e requisitos técnicos
- React + Vite + TypeScript, Tailwind, shadcn/ui, Lucide (ícones), Recharts (gráficos), Framer Motion (animações), React Router (navegação real entre telas).
- Desktop-first (projetar para ~1440px) e 100% responsivo, com layout mobile dedicado.
- Sem backend/dados reais: apenas a ESTRUTURA. Estado em memória (Context + reducer). Formulários funcionais que gravam no estado local. Todos os cálculos automáticos rodam no cliente (ver seção "Cálculos automáticos"). Empty states bem desenhados por padrão. Incluir botão discreto "Carregar dados de exemplo" e "Limpar dados" para pré-visualizar gráficos/animações.
- Números com font-variant-numeric: tabular-nums. Moeda pt-BR (R$ 1.234,56). Datas dd/mm/aaaa.

## Identidade visual (usar exatamente esta, em tokens/CSS variables)
Paleta: fundo #F6F3EE; card #FFFFFF; texto #201E1B; muted #8B857A; bordas #E7E1D8; accent terracota #B06A45 (hover/press #935536); positivo/entrada #6E7D5B; negativo/saída #B4553F; neutros de gráfico #C9C2B6, #A79F91, #8B857A.
Tipografia (Google Fonts): títulos/marca em "Fraunces" (400–500); UI/corpo/números em "Inter" (400–600); labels em MAIÚSCULAS com letter-spacing.
Componentes: cards cantos ~16px, borda 1px #E7E1D8, sombra sutil, padding 20–24px. Botões: primário terracota sólido, secundário outline, ghost para ações discretas.

## Animações (Framer Motion, easing suave 200–300ms, respeitar prefers-reduced-motion)
- Abertura do app: splash rápido com o wordmark "Luz Botelho" (fade + blur→foco) e transição suave para o Dashboard; sidebar e cards entram com stagger (fade + subida de 8px).
- Transição entre páginas: fade + slide curto. Botões: hover eleva -1px e escurece; press escala 0.98. Cards expansíveis animam altura/opacidade. KPIs com count-up. Kanban com drag & drop suave.

## Modelo de dados (entidades)

CLIENTE:
Código (padrão LB+ano+seq, ex. LB2601) [edit], Cliente [edit], CPF/CNPJ [edit], Tipo de Projeto [dropdown], Endereço [edit], Nº Contrato [edit], Data Inicial [edit], Imagem do projeto [upload/opcional], Etapa do funil/Status [dropdown editável], Honorários [auto], Aditivo [auto], Total [auto], Total Pago [auto], Saldo a Receber [auto].

SERVIÇO (itens do contrato de um cliente):
Código do cliente [edit], Serviço/Descrição [edit], Categoria [Honorários|Aditivo|Engenharia], Responsável (eng.) [dropdown], Área/Qtd [edit], Valor/m² [edit], Total [auto = Área × Valor/m²].

PARCELA (recebimentos → Contas a Receber):
Código [edit], Cliente [auto do código], Parcela [edit], Vencimento [edit], Valor [edit], Data Pagamento [edit], Forma [dropdown], Valor Pago [edit], NF [edit], Status [auto: Pago / A vencer / Vencido].

REEMBOLSÁVEL (despesas diretas do cliente — plotagens, insumos, taxas):
Código, Cliente, Data, Descrição, Recibo Nº, Valor, Data Pagto.

IMPOSTO NF:
Código, Cliente, Data, Descrição, NF, Valor do Imposto, Data Pagto.

REPASSE ENGENHARIA (→ Contas a Pagar de eng.):
Código, Cliente, Engenheiro/Empresa [dropdown], Chave PIX [auto do cadastro do engenheiro], Parcela, Marco, Valor, Data Pagamento, Status [auto: Pago / Pendente].

LANÇAMENTO (ledger central de fluxo de caixa):
Data [edit], Mês [auto da data], P/E (Empresa|Pessoal) [dropdown], Categoria [dropdown], Descrição [edit], Entrada [edit], Saída [edit], Forma [dropdown], Conta [dropdown], Obs [edit].

CONTA FIXA (contas a pagar recorrentes):
Grupo [Escritório|Engenharia/Render|Pessoal], Dia [edit], Descrição [edit], Forma [dropdown], valores por mês Jan–Dez [edit], Total [auto], Média/mês [auto].

PROPOSTA / ORÇAMENTO:
Cliente (existente ou novo), Título, Escopo, Itens (Descrição, Qtd/Área, Valor unit., Subtotal auto), Desconto, Total [auto], Condições de pagamento, Validade, Status [Rascunho|Enviada|Aceita|Recusada].

## Cálculos automáticos (implementar de verdade sobre o estado)
- Serviço.Total = Área × Valor/m².
- Cliente.Honorários = soma dos Serviços do cliente com Categoria "Honorários"; Cliente.Aditivo = soma "Aditivo"; Cliente.Total = Honorários + Aditivo.
- Cliente.Total Pago = soma de Parcela.Valor Pago do cliente; Cliente.Saldo a Receber = Total − Total Pago.
- Parcela.Status = "Pago" se Data Pagamento preenchida; senão "Vencido" se Vencimento < hoje, senão "A vencer".
- Repasse.Chave PIX = puxada do cadastro do engenheiro; Status = "Pago" se Data Pagamento preenchida.
- Resumo mensal (por mês, tudo derivado dos Lançamentos): Entradas, Saídas, Saldo (Entradas−Saídas), Caixa Acumulado (roda com Saldo Inicial do Ano), e quebras Entradas/Saídas Empresa e Pessoal, e Recebido de Clientes. Inputs globais: Ano e Saldo Inicial do Ano.
- Rentabilidade por projeto = Recebido − Reembolsáveis − Engenharia − Impostos NF − Custas Fixas (rateio, campo editável) = Resultado; Margem = Resultado / Recebido (%).
- Conta Fixa.Total = soma Jan–Dez; Média/mês = Total / 12.

## Listas (dropdowns, editáveis na tela de Configurações) — valores iniciais
- P/E: Empresa, Pessoal.
- Categoria (lançamentos): Honorários, Plotagem, Engenharia, Imposto, Taxas, Anuidade, Aluguel, Condomínio, Luz, Internet, Plano de Saúde, Salário/Estágio, MKT, Compras e Insumos, Financiamento, Cartão Crédito, Faxina, Colégio, Médico, TED Contas, Seguro, Reembolso Cliente, Outros.
- Forma de pagamento: Pix, Boleto, DA, Cartão, TED, Dinheiro.
- Conta: Banco do Brasil (PF), Santander (PF), Bradesco (PF), Caixa Econômica (PF), Caixa Econômica (PJ), PagBank (PJ).
- Grupo de conta fixa: Escritório, Engenharia/Render, Pessoal.
- Tipo de projeto: Residencial Unifamiliar, Residencial Multifamiliar, Comercial, Reforma, Interiores, Outro.
- Categoria de serviço: Honorários, Aditivo, Engenharia.
- Engenheiro/Empresa (com chave PIX): Polatti Engenharia — Eng. Haroldo; Multiobras — Eng. Ricardo; Videl Engenharia — Eng. Lizandro.
- Etapas do funil (editáveis): Lead, Em contato, Proposta enviada, Contrato ativo, Concluído, Perdido.

## Navegação
Desktop: sidebar fixa (~240px) com logotipo no topo, itens com ícone Lucide + label, item ativo com realce terracota, rodapé com perfil. Top bar: título da tela, busca global, botão "+ Novo" contextual, notificações e avatar.
Mobile: top bar compacta com logo + busca; bottom tab bar com os módulos principais. Conteúdo em coluna única; Kanban vira scroll horizontal; tabelas viram cards.

Módulos:
1. Visão Geral (Dashboard)
2. Clientes & Contratos (CRM)
3. Financeiro (abas: Lançamentos · Fluxo de Caixa · Contas a Receber · Contas a Pagar · Reembolsáveis & Impostos · Rentabilidade)
4. Propostas / Orçamentos
5. Configurações

## Telas prioritárias (construir completas)

### 1) Dashboard
KPIs (cards com count-up e variação vs. mês anterior): Saldo em caixa, A receber, A pagar, Recebido de clientes no mês, Projetos ativos, Leads no funil. Gráfico de Fluxo de Caixa (entradas × saídas + saldo acumulado por mês, linhas finas, sem gridlines pesadas). Gráfico de receita por tipo de projeto (barras horizontais ou donut discreto). Mini-funil do CRM. Listas "Próximos vencimentos" (a pagar/receber) e "Projetos em andamento". Filtro de período (Mês/Trimestre/Ano) e toggle Empresa/Pessoal/Ambos — funcionais.

### 2) Clientes & Contratos (CRM)
Toggle Kanban ⇄ Lista. Pipeline EDITÁVEL: adicionar, renomear, reordenar e excluir etapas (default acima); cards arrastáveis entre colunas (drag & drop), com contador e soma de valores por coluna. Card mostra Cliente, Tipo de projeto, Total do contrato, Saldo a receber, Responsável. Lista: tabela com busca e filtros funcionais (etapa, tipo, status financeiro) e ordenação. Botão "+ Novo cliente" abre drawer/modal.

### 3) Detalhe do Cliente / Projeto
Cabeçalho: nome, código, etapa do funil, imagem do projeto, cards de Total / Total Pago / Saldo a Receber, ações (editar, nova proposta, novo lançamento, nova parcela). Abas: Resumo | Serviços (com cálculo área × valor/m²) | Parcelas (a receber) | Reembolsáveis | Impostos NF | Repasses de Engenharia | Rentabilidade (mini-DRE do projeto) | Notas. Cards/linhas expansíveis com animação.

### 4) Financeiro — Fluxo de Caixa (tela âncora)
Aba Lançamentos: tabela do ledger (Data, Mês, P/E, Categoria, Descrição, Entrada, Saída, Forma, Conta, Obs) com busca, filtros funcionais (período, P/E, categoria, conta, forma) e linha de totais; botão "+ Novo lançamento" (modal). Aba Fluxo de Caixa: resumo mensal automático + gráfico entradas/saídas/saldo acumulado, com Saldo Inicial do Ano editável. Aba Contas a Receber: Parcelas com status e ação "marcar como pago". Aba Contas a Pagar: Contas Fixas (grade mensal Jan–Dez) + Repasses de Engenharia, com vencimentos e "marcar como pago". Aba Reembolsáveis & Impostos: duas listas por cliente. Aba Rentabilidade: tabela por projeto (Recebido, deduções, Resultado, Margem %).

### 5) Nova Proposta / Orçamento
Formulário: cliente (selecionar ou criar), título, escopo, itens (descrição, qtd/área, valor unit., subtotal auto), desconto, total auto, condições de pagamento, validade. Pré-visualização com a identidade do escritório. Ações: salvar rascunho, marcar como enviada (move o lead no funil), duplicar. Ao aceitar, gerar o contrato/serviços do cliente.

## Configurações
Editar todas as Listas (dropdowns) acima, as etapas do funil e o cadastro de engenheiros (nome + chave PIX). Definir Ano e Saldo Inicial do Ano.

## Regras finais
Todos os filtros, toggles e cálculos funcionam sobre o estado local. Nada de emojis — apenas ícones Lucide. Valores sempre em R$ (pt-BR). Empty states com ícone de linha + texto curto + botão de ação. Acessível: foco visível e bom contraste.

Ordem de construção: Dashboard + navegação → Clientes/CRM (pipeline) → Detalhe do cliente → Financeiro/Fluxo de Caixa (com Lançamentos e cálculos) → Propostas → Configurações.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/23a1791a-c3b2-4a74-8c81-996af43b1bf2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
