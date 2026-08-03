import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/state/auth";
import { Card } from "@/components/common/primitives";
import { Field, TextInput } from "@/components/common/fields";
import { Button } from "@/components/common/Button";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError("E-mail ou senha inválidos.");
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
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="E-mail">
              <TextInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Senha">
              <TextInput
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
