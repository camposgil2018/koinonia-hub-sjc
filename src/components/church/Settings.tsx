import { Bell, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, useStore } from "@/lib/church-store";
import { toast } from "sonner";

export function Settings() {
  const users = useStore((state) => state.users);
  const currentUserId = useStore((state) => state.currentUserId);
  const user = users.find((item) => item.id === currentUserId)!;

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Este navegador não oferece suporte a notificações.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") toast.success("Notificações ativadas.");
    else toast.error("Permissão de notificações não concedida.");
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Sua conta</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Ajustes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulte os dados do seu perfil e ajuste as permissões do dispositivo.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{user.name}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{user.email}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Perfil de acesso</p><p className="font-medium">{user.role === "admin" ? "Liderança" : user.role === "moderator" ? "Equipe" : "Membro"}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => void enableNotifications()}>
          <Bell className="mr-2 h-4 w-4" /> Ativar notificações
        </Button>
        <Button variant="outline" onClick={() => { void auth.logout(); toast.success("Sessão encerrada"); }}>
          <LogOut className="mr-2 h-4 w-4" /> Sair da conta
        </Button>
      </div>
    </section>
  );
}
