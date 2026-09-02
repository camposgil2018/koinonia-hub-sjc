import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus, Trash2, CalendarOff, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  useStore,
  store,
  uid,
  CATALOG,
  isUserUnavailable,
  type ScheduleAssignment,
} from "@/lib/church-store";

const formatDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

export function Schedules() {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const isAdmin = me.role === "admin" || me.role === "moderator";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Escalas de Ministérios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize e visualize as escalas dos cultos e eventos.
          </p>
        </div>
        {isAdmin && <NewScheduleDialog />}
      </div>

      <Tabs defaultValue={isAdmin ? "all" : "mine"}>
        <TabsList>
          {isAdmin && <TabsTrigger value="all">Todas as escalas</TabsTrigger>}
          <TabsTrigger value="mine">Minhas escalas</TabsTrigger>
          <TabsTrigger value="unav">
            <CalendarOff className="h-3.5 w-3.5 mr-1.5" />
            Indisponibilidade
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="all" className="mt-5 space-y-5">
            {[...state.schedules]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s) => (
                <ScheduleCard key={s.id} schedule={s} canEdit={isAdmin} />
              ))}
          </TabsContent>
        )}

        <TabsContent value="mine" className="mt-5 space-y-5">
          {state.schedules
            .filter((s) => s.assignments.some((a) => a.userId === me.id))
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((s) => (
              <ScheduleCard key={s.id} schedule={s} canEdit={isAdmin} highlightUserId={me.id} />
            ))}
          {state.schedules.filter((s) => s.assignments.some((a) => a.userId === me.id)).length ===
            0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Você não está em nenhuma escala.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unav" className="mt-5">
          <UnavailabilityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleCard({
  schedule,
  canEdit,
  highlightUserId,
}: {
  schedule: import("@/lib/church-store").Schedule;
  canEdit: boolean;
  highlightUserId?: string;
}) {
  const users = useStore((s) => s.users);
  const unav = useStore((s) => s.unavailability);

  const setScheduleStatus = (scheduleId: string, status: "confirmed" | "declined") => {
    if (!highlightUserId) return;
    store.set((s) => ({
      ...s,
      schedules: s.schedules.map((sch) => {
        if (sch.id !== scheduleId) return sch;
        return {
          ...sch,
          assignments: sch.assignments.map((a) =>
            a.userId === highlightUserId ? { ...a, status } : a
          ),
        };
      }),
      notifications: s.notifications.filter(
        (notification) =>
          !(
            notification.type === "schedule" &&
            notification.refId === scheduleId &&
            notification.userId === highlightUserId
          ),
      ),
    }));
    toast.success(status === "confirmed" ? "Presença confirmada!" : "Presença recusada.");
  };

  const myAssignments = schedule.assignments.filter((a) => a.userId === highlightUserId);
  const hasMyAssignment = myAssignments.length > 0;
  const answered =
    hasMyAssignment && myAssignments.every((a) => a.status && a.status !== "pending");
  const showResponse = hasMyAssignment && !answered;


  const grouped = useMemo(() => {
    const m = new Map<string, ScheduleAssignment[]>();
    schedule.assignments.forEach((a) => {
      if (!m.has(a.ministry)) m.set(a.ministry, []);
      m.get(a.ministry)!.push(a);
    });
    return Array.from(m.entries());
  }, [schedule.assignments]);

  const remove = () => {
    store.set((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== schedule.id) }));
    toast.success("Escala removida");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 flex-row items-start justify-between space-y-0 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {formatDate(schedule.date)} • {schedule.time}
          </div>
          <CardTitle className="text-xl font-display mt-1">{schedule.title}</CardTitle>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <AddMinistryDialog schedule={schedule} />
            <Button
              variant="ghost"
              size="icon"
              onClick={remove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map(([ministry, list]) => (
            <div key={ministry} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-primary" />
                <div className="text-sm font-semibold">{ministry}</div>
              </div>
              <ul className="space-y-2">
                {list.map((a, i) => {
                  const u = users.find((x) => x.id === a.userId);
                  const unavailable = u && isUserUnavailable(u.id, schedule.date, unav);
                  const me = highlightUserId === a.userId;
                    return (
                      <li
                        key={i}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${me ? "bg-gold/15 ring-1 ring-gold/40" : ""}`}
                      >
                        <span className="text-muted-foreground text-xs w-28 shrink-0">{a.role}</span>
                        <span className="flex-1 truncate font-medium">{u?.name ?? "—"}</span>
                        <div className="flex items-center gap-1.5">
                          {a.status === "confirmed" && (
                            <Badge className="bg-success/15 hover:bg-success/25 text-success border-success/30 px-1.5 py-0.5 text-[10px] font-normal">
                              ✔ Confirmado
                            </Badge>
                          )}
                          {a.status === "declined" && (
                            <Badge className="bg-destructive/15 hover:bg-destructive/25 text-destructive border-destructive/30 px-1.5 py-0.5 text-[10px] font-normal">
                              ✘ Recusado
                            </Badge>
                          )}
                          {(a.status === "pending" || !a.status) && (
                            <Badge className="bg-muted text-muted-foreground border-border px-1.5 py-0.5 text-[10px] font-normal">
                              ⏳ Pendente
                            </Badge>
                          )}
                          {unavailable && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Indisponível
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                })}
              </ul>
            </div>
          ))}
        </div>
        {showResponse && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border mt-4">
            <span className="text-xs text-muted-foreground mr-auto">Confirmar sua presença nesta escala:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-success/10 hover:bg-success/20 text-success border-success/30"
              onClick={() => setScheduleStatus(schedule.id, "confirmed")}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
              onClick={() => setScheduleStatus(schedule.id, "declined")}
            >
              Recusar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddMinistryDialog({ schedule }: { schedule: import("@/lib/church-store").Schedule }) {
  const state = useStore((s) => s);
  const users = state.users;
  const unav = state.unavailability;
  const me = users.find((u) => u.id === state.currentUserId)!;
  const options =
    me.role === "admin" || me.ministries.length === 0 ? CATALOG.MINISTRIES : me.ministries;

  const [open, setOpen] = useState(false);
  const [ministry, setMinistry] = useState<string>(options[0] ?? CATALOG.MINISTRIES[0]);
  const [roleName, setRoleName] = useState("");
  const [pickedUser, setPickedUser] = useState("");
  const [rows, setRows] = useState<ScheduleAssignment[]>([]);

  const reset = () => {
    setRoleName("");
    setPickedUser("");
    setRows([]);
  };

  const add = () => {
    if (!roleName || !pickedUser) {
      toast.error("Informe função e voluntário");
      return;
    }
    if (isUserUnavailable(pickedUser, schedule.date, unav)) {
      toast.error("Este voluntário está indisponível nesta data e não pode ser escalado");
      return;
    }
    if (
      schedule.assignments.some((a) => a.userId === pickedUser && a.ministry === ministry) ||
      rows.some((a) => a.userId === pickedUser && a.ministry === ministry)
    ) {
      toast.error("Este voluntário já está nesta escala neste ministério");
      return;
    }
    setRows((p) => [...p, { ministry, role: roleName, userId: pickedUser, status: "pending" }]);
    setRoleName("");
    setPickedUser("");
  };

  const save = () => {
    if (rows.length === 0) {
      toast.error("Adicione ao menos uma escalação");
      return;
    }
    store.set((s) => ({
      ...s,
      schedules: s.schedules.map((sch) =>
        sch.id === schedule.id ? { ...sch, assignments: [...sch.assignments, ...rows] } : sch
      ),
    }));
    toast.success("Ministério incluído nesta escala");
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Incluir meu ministério
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incluir escalação — {schedule.title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          {formatDate(schedule.date)} • {schedule.time}. Os voluntários entram nesta mesma escala,
          para que todos tenham a visão completa do dia.
        </p>
        <div className="grid gap-3">
          <div>
            <Label>Ministério</Label>
            <Select value={ministry} onValueChange={setMinistry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Função</Label>
              <Input
                placeholder="Ex: Vocal"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Voluntário</Label>
              <Select value={pickedUser} onValueChange={setPickedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => {
                    const blocked = isUserUnavailable(u.id, schedule.date, unav);
                    return (
                      <SelectItem key={u.id} value={u.id} disabled={blocked}>
                        <span className="flex items-center gap-2">
                          {u.name}
                          {blocked && (
                            <span className="text-[10px] text-destructive">• indisponível</span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={add} className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Incluir
          </Button>

          {rows.length > 0 && (
            <div className="rounded-lg border divide-y">
              {rows.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">{a.ministry}</span> ·{" "}
                    <span className="font-medium">{a.role}</span> —{" "}
                    {users.find((x) => x.id === a.userId)?.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewScheduleDialog() {

  const [open, setOpen] = useState(false);
  const users = useStore((s) => s.users);
  const unav = useStore((s) => s.unavailability);
  const [title, setTitle] = useState("Culto da Família");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [ministry, setMinistry] = useState<string>(CATALOG.MINISTRIES[0]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [roleName, setRoleName] = useState("");
  const [pickedUser, setPickedUser] = useState<string>("");

  const reset = () => {
    setTitle("Culto da Família");
    setDate("");
    setTime("18:00");
    setAssignments([]);
    setRoleName("");
    setPickedUser("");
  };

  const changeDate = (newDate: string) => {
    setDate(newDate);
    if (!newDate) return;
    const conflicting = assignments.filter((a) => isUserUnavailable(a.userId, newDate, unav));
    if (conflicting.length > 0) {
      setAssignments((prev) => prev.filter((a) => !isUserUnavailable(a.userId, newDate, unav)));
      const names = conflicting
        .map((c) => users.find((u) => u.id === c.userId)?.name ?? "Voluntário")
        .join(", ");
      toast.error(`Removido(s) por indisponibilidade nesta data: ${names}`);
    }
    if (pickedUser && isUserUnavailable(pickedUser, newDate, unav)) setPickedUser("");
  };

  const addAssignment = () => {
    if (!roleName || !pickedUser) {
      toast.error("Informe função e voluntário");
      return;
    }
    if (!date) {
      toast.error("Selecione a data da escala antes de incluir voluntários");
      return;
    }
    if (isUserUnavailable(pickedUser, date, unav)) {
      toast.error("Este voluntário está indisponível nesta data e não pode ser escalado");
      return;
    }
    setAssignments((a) => [...a, { role: roleName, userId: pickedUser, ministry, status: "pending" }]);
    setRoleName("");
    setPickedUser("");
  };

  const save = () => {
    if (!title || !date || !time) {
      toast.error("Preencha título, data e horário");
      return;
    }
    if (assignments.length === 0) {
      toast.error("Adicione ao menos uma escalação");
      return;
    }
    const conflict = assignments.find((a) => isUserUnavailable(a.userId, date, unav));
    if (conflict) {
      const u = users.find((x) => x.id === conflict.userId);
      toast.error(`${u?.name ?? "Voluntário"} está indisponível nesta data. Remova-o(a) antes de salvar.`);
      return;
    }
    store.set((s) => ({
      ...s,
      schedules: [...s.schedules, { id: uid(), title, date, time, assignments }],
    }));
    toast.success("Escala criada com sucesso");
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova escala
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova escala</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => changeDate(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <Label>Ministério</Label>
              <Select value={ministry} onValueChange={setMinistry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG.MINISTRIES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
            <div className="text-sm font-medium">Adicionar voluntário</div>
            {!date && (
              <p className="text-xs text-muted-foreground">
                Selecione a data da escala para liberar a inclusão de voluntários.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Função</Label>
                <Input
                  placeholder="Ex: Vocal"
                  value={roleName}
                  disabled={!date}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Voluntário</Label>
                <Select value={pickedUser} onValueChange={setPickedUser} disabled={!date}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => {
                      const blocked = !!date && isUserUnavailable(u.id, date, unav);
                      return (
                        <SelectItem key={u.id} value={u.id} disabled={blocked}>
                          <span className="flex items-center gap-2">
                            {u.name}
                            {blocked && (
                              <span className="text-[10px] text-destructive">• indisponível</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {date && pickedUser && isUserUnavailable(pickedUser, date, unav) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este voluntário cadastrou indisponibilidade para esta data.
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={!date}
              onClick={addAssignment}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Incluir
            </Button>
          </div>

          {assignments.length > 0 && (
            <div className="space-y-1.5">
              <Label>Escalações adicionadas</Label>
              <div className="rounded-lg border divide-y">
                {assignments.map((a, i) => {
                  const u = users.find((x) => x.id === a.userId);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="text-muted-foreground text-xs">{a.ministry}</span> ·{" "}
                        <span className="font-medium">{a.role}</span> — {u?.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAssignments((p) => p.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar escala</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnavailabilityPanel() {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const canViewAll = me.role === "admin" || me.role === "moderator";
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const mine = state.unavailability.filter((u) => u.userId === me.id);
  const visible = canViewAll ? state.unavailability : mine;

  const add = () => {
    if (!start || !end) {
      toast.error("Informe data inicial e final");
      return;
    }
    if (end < start) {
      toast.error("Data final deve ser após a inicial");
      return;
    }
    let removedCount = 0;
    store.set((s) => {
      const schedules = s.schedules.map((sch) => {
        if (sch.date < start || sch.date > end) return sch;
        const before = sch.assignments.length;
        const filtered = sch.assignments.filter((a) => a.userId !== me.id);
        removedCount += before - filtered.length;
        return { ...sch, assignments: filtered };
      });
      return {
        ...s,
        schedules,
        unavailability: [...s.unavailability, { id: uid(), userId: me.id, start, end, reason }],
      };
    });
    setStart("");
    setEnd("");
    setReason("");
    if (removedCount > 0) {
      toast.success(
        `Indisponibilidade registrada. Você foi removido de ${removedCount} escalação(ões) no período.`,
      );
    } else {
      toast.success("Indisponibilidade registrada");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar indisponibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Informe o período em que você <strong>não</strong> poderá servir. A liderança verá isso
            ao montar as escalas.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Motivo (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Viagem, trabalho..."
            />
          </div>
          <Button onClick={add} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Adicionar período
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {canViewAll ? "Indisponibilidades cadastradas" : "Meus períodos cadastrados"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma indisponibilidade registrada.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div>
                    {canViewAll && (
                      <div className="font-medium">
                        {state.users.find((user) => user.id === u.userId)?.name ?? "Membro"}
                      </div>
                    )}
                    <div className="font-medium">
                      {new Date(u.start + "T12:00:00").toLocaleDateString("pt-BR")} →{" "}
                      {new Date(u.end + "T12:00:00").toLocaleDateString("pt-BR")}
                    </div>
                    {u.reason && <div className="text-xs text-muted-foreground">{u.reason}</div>}
                  </div>
                  {u.userId === me.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        store.set((s) => ({
                          ...s,
                          unavailability: s.unavailability.filter((x) => x.id !== u.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
