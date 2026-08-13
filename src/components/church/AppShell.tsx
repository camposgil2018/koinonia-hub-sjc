import { useState, useEffect, useRef, type ReactNode } from "react";
import logoIgreja from "@/assets/logo-igreja.png";
import {
  Home,
  CalendarDays,
  Users,
  Megaphone,
  Menu,
  ChevronDown,
  UserCog,
  LogOut,
  Bell,
  Check,
  CalendarCheck,
  HandHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, auth, notifications as notifApi } from "@/lib/church-store";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type Tab = "dashboard" | "schedules" | "agenda" | "notices" | "prayers" | "members";

const BASE_NAV: { id: Tab; label: string; icon: typeof Home; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "schedules", label: "Escalas", icon: Users },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "notices", label: "Avisos", icon: Megaphone },
  { id: "prayers", label: "Oração", icon: HandHeart },
  { id: "members", label: "Membros", icon: UserCog, adminOnly: true },
];

export function AppShell({
  tab,
  setTab,
  children,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const current = users.find((u) => u.id === currentUserId)!;
  const isAdmin = current.role === "admin";
  const NAV = BASE_NAV.filter((n) => !n.adminOnly || isAdmin);

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              onPick?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <BrandHeader />
        <div className="flex-1 py-4">
          <NavList />
        </div>
        <UserCard />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground flex flex-col">
            <BrandHeader />
            <div className="flex-1 py-4">
              <NavList onPick={() => setMobileOpen(false)} />
            </div>
            <UserCard />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-base font-semibold">Hub Koinonia</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <RoleBadge />
            <NotificationsBell setTab={setTab} />
            <UserMenu />
          </div>

        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
      <Logo className="h-9 w-9" />
      <div className="leading-tight">
        <div className="font-display text-lg text-sidebar-foreground">Hub Koinonia</div>
        <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">SJC</div>
      </div>
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoIgreja}
      alt="Logo da Igreja"
      className={cn("rounded-md object-contain", className)}
    />
  );
}

function UserCard() {
  const users = useStore((s) => s.users);
  const id = useStore((s) => s.currentUserId);
  const u = users.find((x) => x.id === id)!;
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar user={u} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-sidebar-foreground truncate">{u.name}</div>
          <div className="text-[11px] text-sidebar-foreground/60">
            {u.role === "admin" ? "Administrador" : u.role === "moderator" ? "Moderador" : "Membro"}
          </div>
        </div>
        <button
          onClick={() => {
            auth.logout();
            toast.success("Sessão encerrada");
          }}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Avatar({
  user,
  size = 36,
}: {
  user: { name: string; avatarColor: string };
  size?: number;
}) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <div
      className="rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: user.avatarColor }}
    >
      {initials}
    </div>
  );
}

function UserMenu() {
  const users = useStore((s) => s.users);
  const id = useStore((s) => s.currentUserId);
  const u = users.find((x) => x.id === id)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors">
          <Avatar user={u} size={30} />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">{u.name}</div>
          <div className="text-[11px] text-muted-foreground font-normal">{u.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            auth.logout();
            toast.success("Sessão encerrada");
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleBadge() {
  const users = useStore((s) => s.users);
  const id = useStore((s) => s.currentUserId);
  const u = users.find((x) => x.id === id)!;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          u.role === "admin" ? "bg-gold" : u.role === "moderator" ? "bg-blue-500" : "bg-success"
        )}
      />
      {u.role === "admin" ? "Administrador" : u.role === "moderator" ? "Moderador" : "Membro"}
    </span>
  );
}

function NotificationsBell({ setTab }: { setTab: (t: Tab) => void }) {
  const currentUserId = useStore((s) => s.currentUserId);
  const all = useStore((s) => s.notifications);
  const mine = all.filter((n) => n.userId === currentUserId);
  const unread = mine.filter((n) => !n.read);
  const lastShownRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);

  // Pedir permissão do navegador uma vez
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Disparar notificação nativa quando chega nova
  useEffect(() => {
    if (!mine.length) return;
    const latest = mine[0];
    if (lastShownRef.current === null) {
      lastShownRef.current = latest.id;
      return;
    }
    if (latest.id !== lastShownRef.current && !latest.read) {
      lastShownRef.current = latest.id;
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(latest.title, { body: latest.body, icon: logoIgreja });
        } catch {
          /* ignore */
        }
      }
    }
  }, [mine]);

  const handleClick = (n: (typeof mine)[number]) => {
    notifApi.markRead(n.id);
    setTab(n.link);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 hover:bg-muted transition-colors"
          title="Notificações"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <DropdownMenuLabel className="p-0 text-sm">Notificações</DropdownMenuLabel>
          {unread.length > 0 && (
            <button
              onClick={() => currentUserId && notifApi.markAllRead(currentUserId)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {mine.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </div>
          )}
          {mine.slice(0, 30).map((n) => {
            const Icon = n.type === "schedule" ? CalendarCheck : Megaphone;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left flex gap-3 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/60 transition-colors",
                  !n.read && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                    n.type === "schedule" ? "bg-gold/20 text-gold-foreground" : "bg-success/15 text-success",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    {new Date(n.date).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

