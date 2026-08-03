import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/common/Button";
import { propostaTotais } from "@/lib/calc";
import { brl, formatDate } from "@/lib/format";
import { useApp } from "@/state/store";

export const Route = createFileRoute("/proposta/$propostaId/imprimir")({
  head: () => ({
    meta: [{ title: "Proposta — Luz Botelho Arquitetura" }],
  }),
  component: ImprimirProposta,
});

function ImprimirProposta() {
  const { propostaId } = Route.useParams();
  const state = useApp();
  const proposta = state.propostas.find((p) => p.id === propostaId);

  if (!proposta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-foreground">Proposta não encontrada.</p>
          <Link to="/propostas" className="mt-4 inline-block">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { subtotal, total } = propostaTotais(proposta.itens, proposta.desconto);

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-3xl justify-between px-6 pb-4 print:hidden">
        <Link to="/propostas">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Voltar
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" strokeWidth={1.5} /> Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl bg-card p-10 shadow-sm print:shadow-none">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="" className="h-8 w-auto" />
            <div>
              <p className="font-display text-lg leading-none text-foreground">Luz Botelho</p>
              <p className="label-caps mt-1">Arquitetura</p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Proposta criada em {formatDate(proposta.criadaEm)}</p>
            <p>Válida até {formatDate(proposta.validade)}</p>
          </div>
        </div>

        <h1 className="font-display text-2xl text-foreground">{proposta.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cliente: {proposta.clienteNome}</p>

        {proposta.escopo ? (
          <div className="mt-6">
            <p className="label-caps mb-2">Escopo</p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{proposta.escopo}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="label-caps mb-2">Itens</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Descrição</th>
                <th className="py-2 text-right font-medium">Qtd</th>
                <th className="py-2 text-right font-medium">Valor unit.</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {proposta.itens.map((it) => (
                <tr key={it.id} className="border-b border-border">
                  <td className="py-2">{it.descricao}</td>
                  <td className="num py-2 text-right">{it.qtd}</td>
                  <td className="num py-2 text-right">{brl(it.valorUnit)}</td>
                  <td className="num py-2 text-right">{brl(it.qtd * it.valorUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 space-y-1 text-right text-sm">
            <p className="text-muted-foreground">Subtotal: {brl(subtotal)}</p>
            {proposta.desconto ? <p className="text-muted-foreground">Desconto: −{brl(proposta.desconto)}</p> : null}
            <p className="text-base font-medium text-foreground">Total: {brl(total)}</p>
          </div>
        </div>

        {proposta.condicoes ? (
          <div className="mt-6">
            <p className="label-caps mb-2">Condições de pagamento</p>
            <p className="text-sm text-foreground">{proposta.condicoes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
