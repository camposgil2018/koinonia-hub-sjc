import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth, CATALOG } from "@/lib/church-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Mail, KeyRound, CheckCircle2 } from "lucide-react";
import logoIgreja from "@/assets/logo-igreja.png";

export function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-primary-foreground">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={logoIgreja}
              alt="Logo da Igreja"
              className="h-20 w-20 rounded-xl object-contain shadow-lg"
            />
          </div>
          <h1 className="font-display text-3xl">Hub Koinonia</h1>
          <p className="text-sm text-primary-foreground/70 mt-1 uppercase tracking-widest">SJC</p>
        </div>
        <Card className="shadow-2xl border-0">
          <CardContent className="p-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar-se</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-5">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-5">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>{" "}
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await auth.login(email, password);
    setLoading(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Bem-vindo(a) de volta!");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Senha</Label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs text-primary hover:underline font-medium"
          >
            Esqueci minha senha
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        initialEmail={email}
      />
    </form>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) setEmail(initialEmail);
  }, [initialEmail, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("E-mail de redefinição enviado!");
  };

  const close = () => {
    setSent(false);
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        {!sent ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Redefinir senha</DialogTitle>
              <DialogDescription className="text-center">
                Informe seu e-mail cadastrado. Enviaremos um link seguro para você criar uma nova senha.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Enviando..." : "Enviar e-mail"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center">E-mail enviado!</DialogTitle>
              <DialogDescription className="text-center">
                Se houver uma conta vinculada a <strong>{email}</strong>, você receberá um link para
                criar uma nova senha. Verifique também a caixa de spam.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={close} className="w-full">
                Voltar para o login
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [ministries, setMinistries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMin = (m: string) =>
    setMinistries((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const res = await auth.register({ name, email: normalizedEmail, password, phone, ministries });
    setLoading(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Cadastro realizado! Bem-vindo(a) à Koinonia.");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="reg-name">Nome completo</Label>
        <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="reg-email">E-mail</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="reg-phone">Telefone</Label>
          <Input
            id="reg-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reg-pass">Senha (mín. 6)</Label>
        <Input
          id="reg-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Evite senhas comuns (ex.: 123456, senha123). Use letras, números e símbolos.
        </p>

      </div>
      <div>
        <Label className="mb-1.5 block">Ministérios de interesse</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATALOG.MINISTRIES.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => toggleMin(m)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                ministries.includes(m)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Cadastrando..." : "Criar minha conta"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Novos cadastros entram como{" "}
        <Badge variant="secondary" className="text-[10px]">
          Membro
        </Badge>
        . A liderança pode promover a administrador depois.
      </p>
    </form>
  );
}
