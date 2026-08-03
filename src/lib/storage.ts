import { supabase } from "@/lib/supabase";

const BUCKET = "anexos";

export interface Anexo {
  nome: string;
  path: string;
  criadoEm: string | undefined;
  tamanho: number | undefined;
}

export function pastaCliente(clienteId: string) {
  return `clientes/${clienteId}`;
}

export function pastaLancamento(lancamentoId: string) {
  return `lancamentos/${lancamentoId}`;
}

export async function listarAnexos(pasta: string): Promise<Anexo[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(pasta, {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return (data ?? [])
    .filter((f) => f.id)
    .map((f) => ({
      nome: f.name,
      path: `${pasta}/${f.name}`,
      criadoEm: f.created_at ?? undefined,
      tamanho: f.metadata?.size,
    }));
}

export async function enviarAnexo(pasta: string, arquivo: File): Promise<void> {
  const nome = `${Date.now()}-${arquivo.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(`${pasta}/${nome}`, arquivo);
  if (error) throw error;
}

export async function removerAnexo(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function urlAnexo(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
