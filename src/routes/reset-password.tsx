import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { auth } from "@/lib/church-store";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Hub Koinonia SJC" },
      { name: "description", content: "Defina uma nova senha para sua conta do Hub Koinonia SJC." },
      { property: "og:title", content: "Redefinir senha — Hub Koinonia SJC" },
      {
        property: "og:description",
        content: "Defina uma nova senha para sua conta do Hub Koinonia SJC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    const res = await auth.changePassword(password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Senha atualizada! Você já está conectado.");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-2xl text-primary-foreground mb-6">
          Nova senha
        </h1>
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="new-pass">Nova senha (mín. 6)</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-pass">Confirmar senha</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
