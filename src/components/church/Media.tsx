import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Palette, Plus, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  store,
  uid,
  useStore,
  type MediaRequest,
  type MediaRequestPriority,
  type MediaRequestStatus,
} from "@/lib/church-store";

const STATUS_LABELS: Record<MediaRequestStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  rejected: "Rejeitado",
};

const PRIORITY_LABELS: Record<MediaRequestPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const statusStyle: Record<MediaRequestStatus, string> = {
  pending: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

export function Media() {
  const state = useStore((s) => s);
  const me = state.users.find((user) => user.id === state.currentUserId)!;
  const isAdmin = me.role === "admin";
  const isTeam = isAdmin || me.role === "moderator";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | MediaRequestStatus>("all");
  const [search, setSearch] = useState("");

  const requests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.mediaRequests
      .filter((request) => isAdmin || (me.role === "moderator" ? request.assigneeId === me.id : request.requesterId === me.id))
      .filter((request) => filter === "all" || request.status === filter)
      .filter((request) => !term || `${request.title} ${request.requesterName} ${request.type}`.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.mediaRequests, me, isAdmin, filter, search]);

  const selected = requests.find((request) => request.id === selectedId) ?? requests[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Pedidos de Mídia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize artes, banners, slides e outros materiais da igreja.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm((open) => !open)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo pedido
          </Button>
        )}
      </div>

      {showForm && isAdmin && <MediaRequestForm me={me} onDone={() => setShowForm(false)} />}

      <div className="flex flex-wrap gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedidos" className="w-64" />
        <Select value={filter} onValueChange={(value) => setFilter(value as "all" | MediaRequestStatus)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="space-y-3">
          {requests.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</CardContent></Card>}
          {requests.map((request) => (
            <button key={request.id} type="button" onClick={() => setSelectedId(request.id)} className="block w-full text-left">
              <RequestCard request={request} active={selected?.id === request.id} />
            </button>
          ))}
        </div>
        {selected ? <RequestDetail request={selected} me={me} isTeam={isTeam} /> : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Selecione um pedido para ver os detalhes.</CardContent></Card>}
      </div>
    </div>
  );
}

function RequestCard({ request, active }: { request: MediaRequest; active: boolean }) {
  return (
    <Card className={active ? "ring-2 ring-primary" : "hover:shadow-md transition-shadow"}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusStyle[request.status]}>{STATUS_LABELS[request.status]}</Badge>
          <Badge variant="outline">{PRIORITY_LABELS[request.priority]}</Badge>
          <span className="ml-auto text-xs text-muted-foreground">{request.type}</span>
        </div>
        <h2 className="font-display text-lg">{request.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" />{request.requesterName} · prazo {new Date(request.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>
      </CardContent>
    </Card>
  );
}

function MediaRequestForm({ me, onDone }: { me: { id: string; name: string }; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", type: "Banner", department: "Culto", description: "", reference: "", dueDate: "", priority: "medium" as MediaRequestPriority });
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const save = () => {
    if (!form.title || !form.description || !form.dueDate) {
      toast.error("Preencha título, descrição e prazo");
      return;
    }
    const request: MediaRequest = { ...form, id: uid(), requesterId: me.id, requesterName: me.name, status: "pending", createdAt: new Date().toISOString() };
    store.set((state) => ({
      ...state,
      mediaRequests: [request, ...state.mediaRequests],
      notifications: state.notifications.concat(state.users.filter((user) => user.role === "admin" || user.role === "moderator").filter((user) => user.id !== me.id).map((user) => ({ id: uid(), userId: user.id, type: "media" as const, title: "Novo pedido de mídia", body: request.title, link: "media" as const, refId: request.id, date: request.createdAt, read: false }))),
    }));
    toast.success("Pedido enviado para a equipe de mídia");
    onDone();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-primary" />Novo pedido de mídia</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div><Label>Título</Label><Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ex.: Banner do culto" /></div>
        <div><Label>Tipo</Label><Select value={form.type} onValueChange={(value) => update("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Banner", "Flyer", "Slide", "Logo", "Redes Sociais", "Capa de Vídeo", "Outro"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Departamento</Label><Select value={form.department} onValueChange={(value) => update("department", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Culto", "Jovens", "Kids", "Louvor", "Evangelismo", "Administração", "Outro"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Prazo de entrega</Label><Input type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></div>
        <div><Label>Prioridade</Label><Select value={form.priority} onValueChange={(value) => update("priority", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Referência</Label><Input value={form.reference} onChange={(event) => update("reference", event.target.value)} placeholder="Link ou observação" /></div>
        <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Explique o que a arte precisa conter" /></div>
        <div className="flex gap-2 md:col-span-2"><Button onClick={save}>Enviar pedido</Button><Button variant="ghost" onClick={onDone}>Cancelar</Button></div>
      </CardContent>
    </Card>
  );
}

function RequestDetail({ request, me, isTeam }: { request: MediaRequest; me: { id: string; name: string; role: string }; isTeam: boolean }) {
  const state = useStore((s) => s);
  const [message, setMessage] = useState("");
  const messages = state.mediaMessages.filter((item) => item.requestId === request.id);
  const canEdit = isTeam && (me.role === "admin" || request.assigneeId === me.id);

  const updateRequest = (patch: Partial<MediaRequest>) => {
    store.set((current) => ({
      ...current,
      mediaRequests: current.mediaRequests.map((item) => item.id === request.id ? { ...item, ...patch } : item),
      notifications: patch.status && request.requesterId !== me.id ? current.notifications.concat({ id: uid(), userId: request.requesterId, type: "media", title: "Atualização do pedido de mídia", body: `${request.title}: ${STATUS_LABELS[patch.status]}`, link: "media", refId: request.id, date: new Date().toISOString(), read: false }) : current.notifications,
    }));
    toast.success("Pedido atualizado");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const otherId = me.id === request.requesterId ? request.assigneeId : request.requesterId;
    store.set((current) => ({
      ...current,
      mediaMessages: [...current.mediaMessages, { id: uid(), requestId: request.id, authorId: me.id, authorName: me.name, text: message.trim(), date: new Date().toISOString() }],
      notifications: otherId ? current.notifications.concat({ id: uid(), userId: otherId, type: "media", title: "Nova mensagem no pedido", body: message.trim(), link: "media", refId: request.id, date: new Date().toISOString(), read: false }) : current.notifications,
    }));
    setMessage("");
  };

  return (
    <Card className="h-fit"><CardHeader><CardTitle className="text-lg">{request.title}</CardTitle><div className="flex flex-wrap gap-2"><Badge className={statusStyle[request.status]}>{STATUS_LABELS[request.status]}</Badge><Badge variant="outline">{request.department}</Badge></div></CardHeader>
      <CardContent className="space-y-4 text-sm"><p className="leading-relaxed">{request.description}</p>{request.reference && <p className="text-muted-foreground">Referência: {request.reference}</p>}<div className="grid gap-1 text-xs text-muted-foreground"><span>Solicitante: {request.requesterName}</span><span>Prazo: {new Date(request.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</span><span>Responsável: {request.assigneeName ?? "Ainda não atribuído"}</span></div>
        {canEdit && <div className="grid gap-2 border-t border-border pt-4"><Label>Status</Label><Select value={request.status} onValueChange={(value) => updateRequest({ status: value as MediaRequestStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Label>Responsável</Label><Select value={request.assigneeId ?? "none"} onValueChange={(value) => { const user = state.users.find((item) => item.id === value); updateRequest({ assigneeId: value === "none" ? undefined : value, assigneeName: user?.name }); }}><SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger><SelectContent><SelectItem value="none">Sem responsável</SelectItem>{state.users.filter((user) => user.role === "moderator").map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select>{request.status === "rejected" && <Input placeholder="Motivo da rejeição" defaultValue={request.rejectionReason} onBlur={(event) => updateRequest({ rejectionReason: event.target.value })} />}</div>}
        <div className="space-y-2 border-t border-border pt-4"><div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4" />Conversa</div>{messages.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda.</p>}{messages.map((item) => <div key={item.id} className="rounded-md bg-muted/40 p-2"><div className="text-xs font-medium">{item.authorName}</div><div className="mt-1">{item.text}</div></div>)}<div className="flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva uma mensagem" onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} /><Button size="icon" onClick={sendMessage} title="Enviar mensagem"><Send className="h-4 w-4" /></Button></div></div>
      </CardContent>
    </Card>
  );
}
