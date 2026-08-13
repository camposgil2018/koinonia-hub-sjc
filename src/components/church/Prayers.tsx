import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HandHeart, Plus, MoreVertical, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore, prayers as api, type PrayerRequest, type PrayerStatus } from "@/lib/church-store";

const STATUS: Record<PrayerStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-primary/10 text-primary border-primary/20" },
  orando: { label: "Em oração", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  respondido: {
    label: "Respondido",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
};

export function Prayers() {
  const list = useStore((s) => s.prayers);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const me = users.find((u) => u.id === currentUserId)!;
  const isAdmin = me.role === "admin";

  const visible = list.filter((p) => !p.isPrivate || isAdmin || p.authorId === me.id);
  const mine = list.filter((p) => p.authorId === me.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl">Pedidos de Oração</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe seu pedido e interceda pelos irmãos.
          </p>
        </div>
        <NewPrayerDialog />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["novo", "orando", "respondido"] as PrayerStatus[]).map((st) => (
          <Card key={st}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {STATUS[st].label}
              </p>
              <p className="font-display text-2xl mt-1">
                {visible.filter((p) => p.status === st).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Mural</TabsTrigger>
          <TabsTrigger value="mine">Meus pedidos ({mine.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <PrayerList items={visible} meId={me.id} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <PrayerList items={mine} meId={me.id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrayerList({
  items,
  meId,
  isAdmin,
}: {
  items: PrayerRequest[];
  meId: string;
  isAdmin: boolean;
}) {
  if (!items.length)
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Nenhum pedido de oração por aqui ainda.
        </CardContent>
      </Card>
    );

  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-3">
      {sorted.map((p) => {
        const iPrayed = p.prayedBy.includes(meId);
        const canManage = isAdmin || p.authorId === meId;
        return (
          <Card key={p.id}>
            <CardContent className="p-4 lg:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px]", STATUS[p.status].className)}>
                      {STATUS[p.status].label}
                    </Badge>
                    {p.isPrivate && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Lock className="h-3 w-3" /> Privado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.authorName} •{" "}
                    {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(["novo", "orando", "respondido"] as PrayerStatus[]).map((st) => (
                        <DropdownMenuItem
                          key={st}
                          onClick={() => {
                            api.update(p.id, { status: st });
                            toast.success("Status atualizado");
                          }}
                        >
                          Marcar como {STATUS[st].label.toLowerCase()}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          api.remove(p.id);
                          toast.success("Pedido removido");
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{p.content}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {p.prayedBy.length} {p.prayedBy.length === 1 ? "pessoa orou" : "pessoas oraram"}
                </span>
                <Button
                  size="sm"
                  variant={iPrayed ? "default" : "outline"}
                  onClick={() => api.togglePray(p.id, meId)}
                >
                  <HandHeart className="h-4 w-4 mr-2" />
                  {iPrayed ? "Estou orando" : "Vou orar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function NewPrayerDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Preencha título e descrição");
      return;
    }
    api.add({ title, content, isPrivate });
    toast.success("Pedido enviado. Estaremos orando!");
    setTitle("");
    setContent("");
    setIsPrivate(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Novo pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo pedido de oração</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="p-title">Título</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div>
            <Label htmlFor="p-content">Descrição</Label>
            <Textarea
              id="p-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="p-priv" className="text-sm">
                Pedido privado
              </Label>
              <p className="text-xs text-muted-foreground">Visível apenas para a liderança.</p>
            </div>
            <Switch id="p-priv" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Enviar pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
