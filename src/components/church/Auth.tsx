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
import logoIgreja from "@/assets/logo-igreja.png";

export const EMAIL_DOMAIN = "koinonia.com";

export function toUsername(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export function toEmail(v: string) {
  return `${toUsername(v)}@${EMAIL_DOMAIN}`;
}


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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await auth.login(toEmail(username), password);
    setLoading(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Bem-vindo(a) de volta!");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="login-user">Usuário</Label>
        <div className="flex items-center">
          <Input
            id="login-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="gilmar"
            autoComplete="username"
            className="rounded-r-none"
            required
          />
          <span className="h-9 flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-xs text-muted-foreground">
            @{EMAIL_DOMAIN}
          </span>
        </div>
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
      <p className="text-[11px] text-muted-foreground text-center">
        Esqueceu a senha? Peça para a liderança redefinir seu acesso.
      </p>
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
