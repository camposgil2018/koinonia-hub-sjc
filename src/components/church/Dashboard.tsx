import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore, store } from "@/lib/church-store";
import { CalendarClock, Sparkles, BookOpen, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


const VERSES = [
  { ref: "Salmos 133:1", text: "Oh! quão bom e quão suave é que os irmãos vivam em união." },
  {
    ref: "Atos 2:42",
    text: "E perseveravam na doutrina dos apóstolos, e na comunhão, e no partir do pão, e nas orações.",
  },
  {
    ref: "Hebreus 10:25",
    text: "Não deixemos de congregar-nos, como é costume de alguns, antes admoestemo-nos uns aos outros.",
  },
  {
    ref: "Romanos 12:5",
    text: "Assim nós, embora muitos, somos um só corpo em Cristo e individualmente membros uns dos outros.",
  },
];

const formatDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

export function Dashboard({ goTo }: { goTo: (t: "schedules" | "agenda" | "notices") => void }) {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const verse = VERSES[new Date().getDate() % VERSES.length];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = state.schedules
    .filter((s) => s.date >= today && s.assignments.some((a) => a.userId === me.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  const myNext = upcoming[0];

  const myAssignments = myNext ? myNext.assignments.filter((a) => a.userId === me.id) : [];
  const allConfirmed = myAssignments.length > 0 && myAssignments.every((a) => a.status === "confirmed");
  const anyDeclined = myAssignments.length > 0 && myAssignments.some((a) => a.status === "declined");
  const hasAnswered = allConfirmed || anyDeclined;

  let statusLabel = "Pendente";
  let statusClass = "bg-muted text-muted-foreground hover:bg-muted border border-border";

  if (allConfirmed) {
    statusLabel = "Confirmado";
    statusClass = "bg-success text-success-foreground hover:bg-success";
  } else if (anyDeclined) {
    statusLabel = "Recusado";
    statusClass = "bg-destructive text-destructive-foreground hover:bg-destructive";
  }

  const setMyNextStatus = (status: "confirmed" | "declined") => {
    if (!myNext) return;
    store.set((s) => ({
      ...s,
      schedules: s.schedules.map((sch) => {
        if (sch.id !== myNext.id) return sch;
        return {
          ...sch,
          assignments: sch.assignments.map((a) =>
            a.userId === me.id ? { ...a, status } : a
          ),
        };
      }),
    }));
    toast.success(status === "confirmed" ? "Presença confirmada!" : "Presença recusada.");
  };
  const upcomingEvents = state.events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const recentNotices = [...state.notices]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Olá, bem-vindo(a) de volta</p>
        <h1 className="font-display text-3xl lg:text-4xl mt-1">Paz, {me.name.split(" ")[0]}.</h1>
        {/* Botão para resetar dados locais */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('koinonia-state-v2');
              window.location.reload();
            }}
          >
            Resetar Dados Locais
          </Button>
        </div>
      </div>

      {/* Verse of the day */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold/20 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-success/15 blur-2xl" />
        <CardContent className="relative p-6 lg:p-8">
          <div className="flex items-center gap-2 text-gold mb-3">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium tracking-widest uppercase">Versículo do dia</span>
          </div>
          <blockquote className="font-display text-xl lg:text-2xl leading-snug">
            "{verse.text}"
          </blockquote>
          <p className="mt-4 text-sm text-primary-foreground/70">— {verse.ref}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next scale */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Sua próxima escala
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myNext ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {formatDate(myNext.date)} • {myNext.time}
                    </div>
                    <div className="font-display text-2xl mt-1">{myNext.title}</div>
                  </div>
                  <Badge className={statusClass}>
                    {statusLabel}
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {myNext.assignments
                    .filter((a) => a.userId === me.id)
                    .map((a, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {a.ministry}
                        </div>
                        <div className="text-sm font-medium mt-0.5">{a.role}</div>
                      </div>
                    ))}
                </div>
                {!hasAnswered && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border mt-3">
                    <span className="text-xs text-muted-foreground mr-auto">Confirmar sua presença:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-success/10 hover:bg-success/20 text-success border-success/30"
                      onClick={() => setMyNextStatus("confirmed")}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
                      onClick={() => setMyNextStatus("declined")}
                    >
                      Recusar
                    </Button>
                  </div>
                )}
                <button
                  onClick={() => goTo("schedules")}
                  className="text-sm text-primary hover:underline block pt-2"
                >
                  Ver todas as escalas →
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4">
                Você não possui escalas futuras no momento.
                <br />
                <button
                  onClick={() => goTo("schedules")}
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Cadastrar indisponibilidade →
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-gold" />
              Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center justify-center rounded-md bg-secondary text-secondary-foreground w-12 h-12 shrink-0">
                  <div className="text-[10px] uppercase">
                    {new Date(e.date + "T12:00:00")
                      .toLocaleDateString("pt-BR", { month: "short" })
                      .replace(".", "")}
                  </div>
                  <div className="text-base font-semibold leading-none">{e.date.slice(8, 10)}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.time} • {e.location}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => goTo("agenda")} className="text-sm text-primary hover:underline">
              Ver agenda completa →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent notices */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Avisos recentes</CardTitle>
          <button onClick={() => goTo("notices")} className="text-xs text-primary hover:underline">
            Ver mural →
          </button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {recentNotices.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {n.pinned && <Pin className="h-3 w-3 text-gold" />}
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {n.category}
                </Badge>
              </div>
              <div className="font-medium text-sm">{n.title}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
              <div className="text-[11px] text-muted-foreground mt-3">
                {n.author} • {new Date(n.date + "T12:00:00").toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
