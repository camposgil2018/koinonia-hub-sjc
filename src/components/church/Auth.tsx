import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { auth, CATALOG } from "@/lib/church-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-primary-foreground">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold/60 text-primary font-display font-bold text-2xl mb-4 shadow-lg">
            K
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = auth.login(email, password);
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
        <Label htmlFor="login-password">Senha</Label>
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
    </form>
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = auth.register({ name, email, password, phone, ministries });
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
