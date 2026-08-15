import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/church-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha | Hub Koinonia SJC" },
      { name: "description", content: "Crie uma nova senha para acessar o Hub Koinonia SJC." },
      { property: "og:title", content: "Redefinir senha | Hub Koinonia SJC" },
      { property: "og:description", content: "Crie uma nova senha para acessar o Hub Koinonia SJC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRecoverySession = async () => {
      const hashType = new URLSearchParams(window.location.hash.slice(1)).get("type");
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (hashType === "recovery" || data.user) {
        setEmail(data.user?.email ?? "");
        setReady(true);
      }
    };

    void loadRecoverySession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || event !== "PASSWORD_RECOVERY") return;
      setEmail(session?.user.email ?? "");
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("O link expirou ou não é válido. Solicite um novo e-mail.");
      return;
    }

    const recoveredEmail = data.user.email ?? email;
    if (recoveredEmail) auth.applyRecoveredPassword(recoveredEmail, password);
    await supabase.auth.signOut();
    toast.success("Senha redefinida com sucesso!");
    void navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Criar nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este link de redefinição é inválido ou expirou. Solicite um novo link na tela de login.
              </p>
              <Button className="w-full" onClick={() => void navigate({ to: "/" })}>
                Voltar para o login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster position="top-right" richColors />
    </main>
  );
}