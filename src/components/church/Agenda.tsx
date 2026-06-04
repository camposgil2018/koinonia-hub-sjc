// Lovable sync trigger - Atualização da integração do Google Agenda
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { useStore, store, uid, CATALOG, type ChurchEvent } from "@/lib/church-store";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const categoryColor: Record<string, string> = {
  Culto: "bg-primary text-primary-foreground",
  Reunião: "bg-success text-success-foreground",
  "Pequeno Grupo": "bg-gold text-gold-foreground",
  Conferência: "bg-destructive text-destructive-foreground",
  Ensaio: "bg-secondary text-secondary-foreground",
};

async function fetchGoogleCalendarEvents(calendarId: string, apiKey: string) {
  if (!calendarId || !apiKey) return [];
  const encodedId = encodeURIComponent(calendarId);
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Erro ao buscar eventos do Google Agenda. Verifique as credenciais.");
  }
  const data = await response.json();
  return data.items || [];
}

const mapGoogleCategory = (title: string): string => {
  const t = (title || "").toLowerCase();
  if (t.includes("culto")) return "Culto";
  if (
    t.includes("reunião") ||
    t.includes("reuniao") ||
    t.includes("encontro") ||
    t.includes("oração")
  )
    return "Reunião";
  if (t.includes("ensaio") || t.includes("música") || t.includes("musica") || t.includes("louvor"))
    return "Ensaio";
  if (t.includes("grupo") || t.includes("pg") || t.includes("célula") || t.includes("celula"))
    return "Pequeno Grupo";
  if (
    t.includes("conferência") ||
    t.includes("conferencia") ||
    t.includes("congresso") ||
    t.includes("seminário") ||
    t.includes("seminario")
  )
    return "Conferência";
  return "Culto"; // Padrão
};

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

const mapGoogleEvent = (gEvent: GoogleEvent): ChurchEvent => {
  const start = gEvent.start?.dateTime || gEvent.start?.date || "";
  const dateStr = start.slice(0, 10);

  let timeStr = "19:00";
  if (gEvent.start?.dateTime) {
    try {
      const d = new Date(gEvent.start.dateTime);
      timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      // Ignorar erro
    }
  } else {
    timeStr = "Dia todo";
  }

  return {
    id: `gcal-${gEvent.id}`,
    title: gEvent.summary || "Evento sem título",
    date: dateStr,
    time: timeStr,
    location: gEvent.location || "Local não informado",
    description: gEvent.description || "Importado do Google Agenda.",
    category: mapGoogleCategory(gEvent.summary),
  };
};

export function Agenda() {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const isAdmin = me.role === "admin";

  const { data: gcalEvents = [], error: gcalError } = useQuery({
    queryKey: ["googleCalendarEvents", state.googleCalendarId, state.googleApiKey],
    queryFn: () =>
      fetchGoogleCalendarEvents(state.googleCalendarId || "", state.googleApiKey || ""),
    enabled: !!(state.syncGoogleCalendar && state.googleCalendarId && state.googleApiKey),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (gcalError) {
      toast.error("Não foi possível sincronizar com o Google Agenda. Verifique as credenciais.");
    }
  }, [gcalError]);

  const allEvents = useMemo(() => {
    if (!state.syncGoogleCalendar || gcalEvents.length === 0) {
      return state.events;
    }
    const mappedGcal = gcalEvents.map(mapGoogleEvent);
    return [...state.events, ...mappedGcal];
  }, [state.events, state.syncGoogleCalendar, gcalEvents]);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<ChurchEvent | null>(null);

  const grid = useMemo(() => {
    const first = new Date(cursor);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: string | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date: dt.toISOString().slice(0, 10) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, ChurchEvent[]>();
    allEvents.forEach((e) => {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    });
    return m;
  }, [allEvents]);

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Agenda da Igreja</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calendário completo de cultos, reuniões e eventos.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <GoogleCalendarSettingsDialog />}
          {isAdmin && <NewEventDialog />}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-display text-lg capitalize">{monthLabel}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((c, i) => {
              const ev = c.date ? (eventsByDate.get(c.date) ?? []) : [];
              const isToday = c.date === todayIso;
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[64px] sm:min-h-[92px] rounded-md border p-1.5 sm:p-2 text-left",
                    c.date ? "bg-card border-border" : "bg-transparent border-transparent",
                    isToday && "ring-2 ring-gold",
                  )}
                >
                  {c.date && (
                    <>
                      <div
                        className={cn(
                          "text-[11px] font-medium",
                          isToday ? "text-gold" : "text-muted-foreground",
                        )}
                      >
                        {c.date.slice(8, 10)}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {ev.slice(0, 2).map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setSelected(e)}
                            className={cn(
                              "w-full truncate rounded px-1 py-0.5 text-[10px] sm:text-[11px] font-medium text-left",
                              categoryColor[e.category] ?? "bg-secondary text-secondary-foreground",
                            )}
                          >
                            {e.title}
                          </button>
                        ))}
                        {ev.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{ev.length - 2}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {CATALOG.EVENT_CATEGORIES.map((c) => (
          <Badge key={c} className={cn("font-normal", categoryColor[c])}>
            {c}
          </Badge>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Badge className={cn("w-fit", categoryColor[selected.category])}>
                    {selected.category}
                  </Badge>
                  {selected.id.startsWith("gcal-") && (
                    <Badge
                      variant="outline"
                      className="w-fit border-blue-400 text-blue-500 bg-blue-50/50"
                    >
                      Google Agenda
                    </Badge>
                  )}
                </div>
                <DialogTitle className="font-display text-2xl mt-2">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(selected.date + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  • {selected.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {selected.location}
                </div>
                <p className="pt-2 leading-relaxed">{selected.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewEventDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<ChurchEvent, "id">>({
    title: "",
    date: "",
    time: "19:00",
    location: "",
    description: "",
    category: "Culto",
  });

  const save = () => {
    if (!form.title || !form.date || !form.location) {
      toast.error("Preencha título, data e local");
      return;
    }
    store.set((s) => ({ ...s, events: [...s.events, { ...form, id: uid() }] }));
    toast.success("Evento adicionado à agenda");
    setForm({
      title: "",
      date: "",
      time: "19:00",
      location: "",
      description: "",
      category: "Culto",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Local</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATALOG.EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoogleCalendarSettingsDialog() {
  const state = useStore((s) => s);
  const [open, setOpen] = useState(false);
  const [sync, setSync] = useState(state.syncGoogleCalendar ?? false);
  const [calendarId, setCalendarId] = useState(state.googleCalendarId ?? "");
  const [apiKey, setApiKey] = useState(state.googleApiKey ?? "");

  useEffect(() => {
    if (open) {
      setSync(state.syncGoogleCalendar ?? false);
      setCalendarId(state.googleCalendarId ?? "");
      setApiKey(state.googleApiKey ?? "");
    }
  }, [open, state]);

  const save = () => {
    if (sync && (!calendarId || !apiKey)) {
      toast.error("Para habilitar a sincronização, preencha o Calendar ID e a API Key.");
      return;
    }
    store.set((s) => ({
      ...s,
      syncGoogleCalendar: sync,
      googleCalendarId: calendarId.trim(),
      googleApiKey: apiKey.trim(),
    }));
    toast.success("Configurações do Google Agenda atualizadas.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Sincronizar Google Agenda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integração com Google Agenda</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Sincronizar Eventos</Label>
              <div className="text-[12px] text-muted-foreground">
                Habilitar sincronização com calendário do Google
              </div>
            </div>
            <Switch checked={sync} onCheckedChange={setSync} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gcal-id">ID do Calendário do Google</Label>
            <Input
              id="gcal-id"
              placeholder="exemplo@group.calendar.google.com"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              disabled={!sync}
            />
            <p className="text-[10px] text-muted-foreground">
              Use o e-mail do calendário público ou "primary" se for o principal da conta.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gcal-key">Chave de API (API Key)</Label>
            <Input
              id="gcal-key"
              type="password"
              placeholder="Sua Google API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={!sync}
            />
            <p className="text-[10px] text-muted-foreground">
              Chave com permissão de leitura para a "Google Calendar API" no console do Google
              Cloud.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
