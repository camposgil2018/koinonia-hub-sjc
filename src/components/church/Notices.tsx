import { useState } from "react";
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
import { Archive, Pin, PinOff, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useStore, store, uid, CATALOG, type Notice } from "@/lib/church-store";
import { cn } from "@/lib/utils";

const categoryStyles: Record<string, string> = {
  Geral: "bg-secondary text-secondary-foreground",
  Jovens: "bg-success/15 text-success",
  Casais: "bg-gold/20 text-gold-foreground",
  Liderança: "bg-primary text-primary-foreground",
};

export function Notices() {
  const state = useStore((s) => s);
  const me = state.users.find((u) => u.id === state.currentUserId)!;
  const isAdmin = me.role === "admin" || me.role === "moderator";
  const [view, setView] = useState<"active" | "archived">("active");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const active = state.notices.filter((notice) => notice.date >= today);
  const archived = state.notices.filter((notice) => notice.date < today);
  const visible = view === "archived" && isAdmin ? archived : active;
  const sorted = [...visible].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Mural de Avisos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comunicados importantes da nossa comunidade.
          </p>
        </div>
        {isAdmin && <NoticeDialog mode="create" />}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Button variant={view === "active" ? "default" : "outline"} onClick={() => setView("active")}>
            Avisos ativos <Badge variant="secondary" className="ml-2">{active.length}</Badge>
          </Button>
          <Button variant={view === "archived" ? "default" : "outline"} onClick={() => setView("archived")}>
            <Archive className="mr-2 h-4 w-4" /> Arquivados
            <Badge variant="secondary" className="ml-2">{archived.length}</Badge>
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {view === "archived" ? "Nenhum aviso arquivado." : "Nenhum aviso ativo no momento."}
            </CardContent>
          </Card>
        )}
        {sorted.map((n) => (
          <NoticeCard key={n.id} notice={n} canEdit={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function NoticeCard({ notice, canEdit }: { notice: Notice; canEdit: boolean }) {
  const togglePin = () => {
    store.set((s) => ({
      ...s,
      notices: s.notices.map((n) => (n.id === notice.id ? { ...n, pinned: !n.pinned } : n)),
    }));
    toast.success(notice.pinned ? "Aviso desafixado" : "Aviso fixado no topo");
  };
  const remove = () => {
    store.set((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== notice.id) }));
    toast.success("Aviso removido");
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        notice.pinned && "ring-1 ring-gold/50",
      )}
    >
      {notice.pinned && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-foreground">
          <Pin className="h-3 w-3" />
          Fixado
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <Badge className={cn("font-normal", categoryStyles[notice.category] ?? "bg-secondary")}>
          {notice.category}
        </Badge>
        <h3 className="font-display text-xl leading-tight">{notice.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{notice.content}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {notice.author} • {new Date(notice.date + "T12:00:00").toLocaleDateString("pt-BR")}
          </div>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePin}>
                {notice.pinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </Button>
              <NoticeDialog
                mode="edit"
                notice={notice}
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NoticeDialog({
  mode,
  notice,
  trigger,
}: {
  mode: "create" | "edit";
  notice?: Notice;
  trigger?: React.ReactNode;
}) {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId)!);
  const [open, setOpen] = useState(false);
  const defaultExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const [form, setForm] = useState<Omit<Notice, "id">>(
    () =>
      notice ?? {
        title: "",
        category: "Geral",
        content: "",
        date: defaultExpirationDate(),
        author: me.name,
        pinned: false,
      },
  );

  const save = () => {
    if (!form.title || !form.content) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    if (mode === "create") {
      store.set((s) => ({ ...s, notices: [{ ...form, id: uid() }, ...s.notices] }));
      toast.success("Aviso publicado");
    } else {
      store.set((s) => ({
        ...s,
        notices: s.notices.map((n) => (n.id === notice!.id ? { ...n, ...form } : n)),
      }));
      toast.success("Aviso atualizado");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo aviso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo aviso" : "Editar aviso"}</DialogTitle>
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
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG.NOTICE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exibir até</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />
            Fixar no topo
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>{mode === "create" ? "Publicar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
