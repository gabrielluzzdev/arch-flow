import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/state/auth";
import { Card } from "@/components/common/primitives";
import { Field, TextInput } from "@/components/common/fields";
import { Button } from "@/components/common/Button";

export function ChangePassword() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <p className="font-display text-3xl text-foreground">Luz Botelho</p>
          <p className="label-caps mt-2">Arquitetura</p>
        </div>
        <Card>
          <p className="mb-5 text-sm text-muted-foreground">
            Este é seu primeiro acesso. Defina uma nova senha para continuar.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nova senha">
              <TextInput
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirmar senha">
              <TextInput
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Salvando…" : "Salvar nova senha"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => signOut()}
              className="w-full justify-center"
            >
              Cancelar e sair
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
