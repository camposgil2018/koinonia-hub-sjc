import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Pencil, Trash2 } from "lucide-react";
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

export function Agenda() {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const isAdmin = me.role === "admin" || me.role === "moderator";

  const allEvents = state.events;

  const removeEvent = (eventId: string) => {
    if (!confirm("Tem certeza que deseja remover este evento da agenda?")) return;
    store.set((s) => ({ ...s, events: s.events.filter((e) => e.id !== eventId) }));
    toast.success("Evento removido da agenda");
    setSelected(null);
  };

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
          {isAdmin && <EventDialog mode="create" />}
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
                {isAdmin && (
                  <div className="flex items-center gap-2 pt-4 border-t border-border mt-4 justify-end">
                    <EventDialog
                      mode="edit"
                      event={selected}
                      onSuccess={() => setSelected(null)}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => removeEvent(selected.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventDialog({
  mode,
  event,
  trigger,
  onSuccess,
}: {
  mode: "create" | "edit";
  event?: ChurchEvent;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<ChurchEvent, "id">>(
    () =>
      event ?? {
        title: "",
        date: "",
        time: "19:00",
        location: "",
        description: "",
        category: "Culto",
      },
  );

  useEffect(() => {
    if (open && event) {
      setForm(event);
    }
  }, [open, event]);

  const save = () => {
    if (!form.title || !form.date || !form.location) {
      toast.error("Preencha título, data e local");
      return;
    }
    if (mode === "create") {
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
    } else {
      store.set((s) => ({
        ...s,
        events: s.events.map((e) => (e.id === event!.id ? { ...e, ...form } : e)),
      }));
      toast.success("Evento atualizado");
      onSuccess?.();
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo evento" : "Editar evento"}</DialogTitle>
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
          <Button onClick={save}>{mode === "create" ? "Adicionar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
