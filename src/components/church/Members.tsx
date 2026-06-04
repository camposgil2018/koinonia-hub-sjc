import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Shield, ShieldOff, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useStore, store, type User } from "@/lib/church-store";
import { cn } from "@/lib/utils";

export function Members() {
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.currentUserId);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const arr = [...users].sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    if (!term) return arr;
    return arr.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.ministries.some((m) => m.toLowerCase().includes(term)),
    );
  }, [users, q]);

  const toggleRole = (u: User) => {
    store.set((s) => ({
      ...s,
      users: s.users.map((x) => x.id === u.id ? { ...x, role: x.role === "admin" ? "member" : "admin" } : x),
    }));
    toast.success(u.role === "admin" ? `${u.name} agora é membro` : `${u.name} promovido(a) a administrador`);
  };

  const remove = (u: User) => {
    if (u.id === meId) { toast.error("Você não pode remover a si mesmo"); return; }
    if (!confirm(`Remover ${u.name}? Esta ação não pode ser desfeita.`)) return;
    store.set((s) => ({
      ...s,
      users: s.users.filter((x) => x.id !== u.id),
      schedules: s.schedules.map((sc) => ({ ...sc, assignments: sc.assignments.filter((a) => a.userId !== u.id) })),
      unavailability: s.unavailability.filter((un) => un.userId !== u.id),
    }));
    toast.success("Membro removido");
  };

  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Membros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} cadastrados • {admins} administrador{admins !== 1 && "es"}
          </p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail ou ministério" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 w-72" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((u) => (
          <Card key={u.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className="rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 h-12 w-12"
                style={{ backgroundColor: u.avatarColor }}
              >
                {u.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium truncate">{u.name}</div>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className={cn("text-[10px]", u.role === "admin" && "bg-gold text-gold-foreground hover:bg-gold")}>
                    {u.role === "admin" ? "Administrador" : "Membro"}
                  </Badge>
                  {u.id === meId && <Badge variant="outline" className="text-[10px]">Você</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />{u.email}
                </div>
                {u.phone && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{u.phone}
                  </div>
                )}
                {u.ministries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.ministries.map((m) => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggleRole(u)} title={u.role === "admin" ? "Tornar membro" : "Tornar admin"}>
                  {u.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4 text-gold" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEdit(u)} className="text-xs">
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(u)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</CardContent>
          </Card>
        )}
      </div>

      <EditMemberDialog user={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function EditMemberDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ministries, setMinistries] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      setMinistries(user.ministries.join(", "));
    }
  }, [user]);

  const save = () => {
    if (!user) return;
    store.set((s) => ({
      ...s,
      users: s.users.map((u) => u.id === user.id
        ? { ...u, name: name.trim() || u.name, phone, ministries: ministries.split(",").map((m) => m.trim()).filter(Boolean) }
        : u),
    }));
    toast.success("Membro atualizado");
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar membro</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>Ministérios (separe por vírgula)</Label><Input value={ministries} onChange={(e) => setMinistries(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
