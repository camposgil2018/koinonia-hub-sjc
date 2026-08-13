import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreVertical, Search, Phone, Mail, Trash2, Pencil, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore, contacts as api, type Contact, type ContactType } from "@/lib/church-store";

const TYPE_LABEL: Record<ContactType, string> = {
  congregado: "Congregado",
  visitante: "Visitante",
};

const emptyForm = (): Omit<Contact, "id"> => ({
  name: "",
  type: "visitante",
  phone: "",
  email: "",
  birthDate: "",
  address: "",
  firstVisit: new Date().toISOString().slice(0, 10),
  invitedBy: "",
  followedUp: false,
  notes: "",
});

export function People() {
  const list = useStore((s) => s.contacts);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ContactType>("all");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list
      .filter((c) => (filter === "all" ? true : c.type === filter))
      .filter(
        (c) =>
          !term ||
          c.name.toLowerCase().includes(term) ||
          (c.phone ?? "").includes(term) ||
          (c.email ?? "").toLowerCase().includes(term),
      )
      .sort((a, b) => (a.firstVisit < b.firstVisit ? 1 : -1));
  }, [list, q, filter]);

  const stats = {
    total: list.length,
    visitantes: list.filter((c) => c.type === "visitante").length,
    congregados: list.filter((c) => c.type === "congregado").length,
    pendentes: list.filter((c) => !c.followedUp).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl">Congregados e Visitantes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe quem visitou a igreja e faça o follow-up pastoral.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Cadastrar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Visitantes", value: stats.visitantes },
          { label: "Congregados", value: stats.congregados },
          { label: "Follow-up pendente", value: stats.pendentes },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="visitante">Visitantes</TabsTrigger>
            <TabsTrigger value="congregado">Congregados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{c.name}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          c.type === "visitante"
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                            : "bg-primary/10 text-primary border-primary/20",
                        )}
                      >
                        {TYPE_LABEL[c.type]}
                      </Badge>
                      {!c.followedUp && (
                        <Badge variant="secondary" className="text-[10px]">
                          Follow-up pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1ª visita:{" "}
                      {new Date(c.firstVisit + "T12:00:00").toLocaleDateString("pt-BR")}
                      {c.invitedBy ? ` • convidado por ${c.invitedBy}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-0.5">
                      {c.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                    </div>
                    {c.notes && <p className="text-sm text-foreground/80 pt-1">{c.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.phone && (
                      <Button asChild variant="outline" size="icon" className="h-8 w-8">
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Enviar WhatsApp para ${c.name}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            api.update(c.id, { followedUp: !c.followedUp });
                            toast.success("Follow-up atualizado");
                          }}
                        >
                          {c.followedUp ? "Marcar como pendente" : "Marcar follow-up feito"}
                        </DropdownMenuItem>
                        {c.type === "visitante" && (
                          <DropdownMenuItem
                            onClick={() => {
                              api.update(c.id, { type: "congregado" });
                              toast.success("Agora é congregado!");
                            }}
                          >
                            Tornar congregado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            api.remove(c.id);
                            toast.success("Registro removido");
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Contact | null;
}) {
  const [form, setForm] = useState<Omit<Contact, "id">>(emptyForm());

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id: _id, ...rest } = editing;
      setForm({ ...emptyForm(), ...rest });
    } else {
      setForm(emptyForm());
    }
  }, [open, editing]);

  const set = <K extends keyof Omit<Contact, "id">>(k: K, v: Omit<Contact, "id">[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const payload = { ...form, name: form.name.trim().slice(0, 100) };
    if (editing) {
      api.update(editing.id, payload);
      toast.success("Registro atualizado");
    } else {
      api.add(payload);
      toast.success("Cadastro realizado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar registro" : "Novo congregado / visitante"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="c-name">Nome completo</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as ContactType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitante">Visitante</SelectItem>
                  <SelectItem value="congregado">Congregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="c-first">1ª visita</Label>
              <Input
                id="c-first"
                type="date"
                value={form.firstVisit}
                onChange={(e) => set("firstVisit", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-phone">Telefone</Label>
              <Input
                id="c-phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                maxLength={255}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-birth">Nascimento</Label>
              <Input
                id="c-birth"
                type="date"
                value={form.birthDate ?? ""}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-inv">Convidado por</Label>
              <Input
                id="c-inv"
                value={form.invitedBy ?? ""}
                onChange={(e) => set("invitedBy", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-addr">Endereço</Label>
            <Input
              id="c-addr"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="c-notes">Observações pastorais</Label>
            <Textarea
              id="c-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="c-follow" className="text-sm">
                Follow-up realizado
              </Label>
              <p className="text-xs text-muted-foreground">Contato pastoral já foi feito.</p>
            </div>
            <Switch
              id="c-follow"
              checked={form.followedUp}
              onCheckedChange={(v) => set("followedUp", v)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              {editing ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
