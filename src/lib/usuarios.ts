import { supabase } from "@/lib/supabase";

export interface Perfil {
  id: string;
  nome: string;
  papel: "admin" | "colaborador";
  created_at: string;
}

export async function listarPerfis(): Promise<Perfil[]> {
  const { data, error } = await supabase.from("perfis").select("*").order("created_at");
  if (error) throw error;
  return data as Perfil[];
}

async function chamarGerenciarUsuarios(payload: Record<string, unknown>): Promise<{ ok: true; id?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const url = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/gerenciar-usuarios`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Falha na operação.");
  return json;
}

export const criarUsuario = (nome: string, email: string, senha: string, papel: "admin" | "colaborador") =>
  chamarGerenciarUsuarios({ acao: "criar", nome, email, senha, papel });

export const removerUsuario = (id: string) => chamarGerenciarUsuarios({ acao: "remover", id });

export const redefinirSenhaUsuario = (id: string, senha: string) =>
  chamarGerenciarUsuarios({ acao: "redefinir-senha", id, senha });

export async function atualizarPapel(id: string, papel: "admin" | "colaborador") {
  const { error } = await supabase.from("perfis").update({ papel }).eq("id", id);
  if (error) throw error;
}
