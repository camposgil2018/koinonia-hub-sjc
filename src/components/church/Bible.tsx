import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore, devotionals as devApi, type Devotional } from "@/lib/church-store";
import { bibleNotes, type BibleNote } from "@/lib/bible-notes";

type Book = { bookid: number; name: string; chapters: number };
type Verse = { verse: number; text: string };

const API = "https://bolls.life";
const TRANSLATION = "NVIPT";

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim();

const noteErrorMessage = (error: unknown, action: "load" | "save" | "remove") => {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") {
    return "As anotações ainda precisam ser ativadas no banco de dados.";
  }

  if (action === "load") return "Não foi possível carregar suas anotações.";
  if (action === "remove") return "Não foi possível remover a anotação.";
  return "Não foi possível salvar a anotação.";
};

export function Bible() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const me = users.find((u) => u.id === currentUserId);
  const canManage = me?.role === "admin" || me?.role === "moderator";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl">Bíblia</h1>
        <p className="text-sm text-muted-foreground">
          Nova Versão Internacional (NVI) e devocionais da liderança.
        </p>
      </div>

      <Tabs defaultValue="biblia">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="biblia">Bíblia NVI</TabsTrigger>
          <TabsTrigger value="devocionais">Devocionais</TabsTrigger>
          <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
        </TabsList>
        <TabsContent value="biblia" className="mt-4">
          <BibleReader />
        </TabsContent>
        <TabsContent value="devocionais" className="mt-4">
          <Devotionals canManage={!!canManage} />
        </TabsContent>
        <TabsContent value="anotacoes" className="mt-4">
          <PersonalNotes userId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BibleReader() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<number>(43); // João
  const [chapter, setChapter] = useState<number>(3);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/get-books/${TRANSLATION}/`)
      .then((r) => r.json())
      .then((d: Book[]) => alive && setBooks(d))
      .catch(() => alive && setError("Não foi possível carregar os livros."));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`${API}/get-chapter/${TRANSLATION}/${bookId}/${chapter}/`)
      .then((r) => r.json())
      .then((d: Verse[]) => {
        if (!alive) return;
        setVerses(Array.isArray(d) ? d : []);
      })
      .catch(() => alive && setError("Não foi possível carregar o capítulo."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [bookId, chapter]);

  const book = books.find((b) => b.bookid === bookId);
  const chapters = useMemo(
    () => Array.from({ length: book?.chapters ?? 1 }, (_, i) => i + 1),
    [book],
  );

  const shown = query.trim()
    ? verses.filter((v) => stripTags(v.text).toLowerCase().includes(query.trim().toLowerCase()))
    : verses;

  const selectBook = (nextBookId: number) => {
    setBookId(nextBookId);
    setChapter(1);
    setBookPickerOpen(false);
  };

  const previousChapter = () => setChapter((currentChapter) => Math.max(1, currentChapter - 1));
  const nextChapter = () =>
    setChapter((currentChapter) => Math.min(book?.chapters ?? 1, currentChapter + 1));

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <Label>Passagem</Label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
              <Button
                variant="outline"
                className="justify-between gap-3 overflow-hidden"
                onClick={() => setBookPickerOpen(true)}
              >
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{book?.name ?? "Carregando livros..."}</span>
                </span>
                <span className="text-xs text-muted-foreground">Livro</span>
              </Button>
              <Button variant="outline" onClick={() => setChapterPickerOpen(true)}>
                Cap. {chapter}
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousChapter}
              disabled={chapter <= 1}
              aria-label="Capítulo anterior"
              title="Capítulo anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextChapter}
              disabled={chapter >= (book?.chapters ?? 1)}
              aria-label="Próximo capítulo"
              title="Próximo capítulo"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verse-search">Buscar neste capítulo</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="verse-search"
              className="pl-9 pr-10"
              placeholder="Palavra ou frase"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <BookPicker
        books={books}
        open={bookPickerOpen}
        selectedBookId={bookId}
        onOpenChange={setBookPickerOpen}
        onSelect={selectBook}
      />
      <ChapterPicker
        bookName={book?.name}
        chapters={chapters}
        currentChapter={chapter}
        open={chapterPickerOpen}
        onOpenChange={setChapterPickerOpen}
        onSelect={(nextChapter) => {
          setChapter(nextChapter);
          setChapterPickerOpen(false);
        }}
      />

      <div className="rounded-xl border border-border bg-card p-5 lg:p-7">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl">
            {book?.name ?? "…"} {chapter}
          </h2>
          <span className="ml-auto text-[11px] uppercase tracking-wider text-muted-foreground">
            NVI
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        )}
        {error && !loading && <p className="text-sm text-destructive py-6">{error}</p>}
        {!loading && !error && (
          <div className="space-y-3 leading-relaxed">
            {shown.map((v) => (
              <p key={v.verse} className="text-[15px]">
                <sup className="mr-1.5 font-semibold text-primary">{v.verse}</sup>
                {stripTags(v.text)}
              </p>
            ))}
            {!shown.length && (
              <p className="text-sm text-muted-foreground">Nenhum versículo encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonalNotes({
  userId,
}: {
  userId: string | null;
}) {
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BibleNote | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      return;
    }

    let alive = true;
    setLoading(true);
    setLoadError(null);
    void bibleNotes
      .list(userId)
      .then((items) => {
        if (alive) setNotes(items);
      })
      .catch((error) => {
        if (alive) setLoadError(noteErrorMessage(error, "load"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  const openNewNote = () => {
    setEditingNote(null);
    setContent("");
    setEditorOpen(true);
  };

  const openEditNote = (note: BibleNote) => {
    setEditingNote(note);
    setContent(note.content);
    setEditorOpen(true);
  };

  const handleEditorChange = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setEditingNote(null);
      setContent("");
    }
  };

  const saveNote = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error("Escreva uma anotação antes de salvar.");
      return;
    }
    if (!userId) return;

    setSaving(true);
    try {
      const saved = editingNote
        ? await bibleNotes.update(editingNote.id, trimmedContent)
        : await bibleNotes.create({
            userId,
            content: trimmedContent,
          });

      setNotes((currentNotes) =>
        editingNote
          ? currentNotes.map((note) => (note.id === saved.id ? saved : note))
          : [saved, ...currentNotes],
      );
      toast.success(editingNote ? "Anotação atualizada." : "Anotação salva.");
      handleEditorChange(false);
    } catch (error) {
      toast.error(noteErrorMessage(error, "save"));
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (id: string) => {
    setDeletingId(id);
    try {
      await bibleNotes.remove(id);
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
      toast.success("Anotação removida.");
    } catch (error) {
      toast.error(noteErrorMessage(error, "remove"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl">Minhas anotações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Um espaço pessoal e privado para suas reflexões.
          </p>
        </div>
        <Button size="sm" onClick={openNewNote}>
          <NotebookPen className="h-4 w-4" /> Nova anotação
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando anotações...
        </div>
      )}
      {loadError && !loading && (
        <p className="py-4 text-sm text-destructive">{loadError}</p>
      )}
      {!loading && !loadError && !notes.length && (
        <p className="py-4 text-sm text-muted-foreground">
          Registre aqui suas reflexões, orações e aprendizados.
        </p>
      )}
      {!loading && !loadError && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <article key={note.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditNote(note)}
                    aria-label="Editar anotação"
                    title="Editar anotação"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void removeNote(note.id)}
                    disabled={deletingId === note.id}
                    aria-label="Excluir anotação"
                    title="Excluir anotação"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Atualizada em {new Date(note.updated_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </article>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={handleEditorChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Editar anotação" : "Nova anotação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bible-note">Sua anotação</Label>
            <Textarea
              id="bible-note"
              rows={8}
              maxLength={10000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva sua reflexão sobre esta passagem..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleEditorChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void saveNote()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar anotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BookPicker({
  books,
  open,
  selectedBookId,
  onOpenChange,
  onSelect,
}: {
  books: Book[];
  open: boolean;
  selectedBookId: number;
  onOpenChange: (open: boolean) => void;
  onSelect: (bookId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredBooks = books.filter((book) =>
    book.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
  );
  const oldTestament = filteredBooks.filter((book) => book.bookid <= 39);
  const newTestament = filteredBooks.filter((book) => book.bookid > 39);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>Escolha um livro</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-9"
              placeholder="Pesquisar livro"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 pb-5">
          {!filteredBooks.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</p>
          ) : (
            <div className="space-y-5">
              <BookGroup title="Antigo Testamento" books={oldTestament} selectedBookId={selectedBookId} onSelect={onSelect} />
              <BookGroup title="Novo Testamento" books={newTestament} selectedBookId={selectedBookId} onSelect={onSelect} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookGroup({
  title,
  books,
  selectedBookId,
  onSelect,
}: {
  title: string;
  books: Book[];
  selectedBookId: number;
  onSelect: (bookId: number) => void;
}) {
  if (!books.length) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {books.map((book) => (
          <Button
            key={book.bookid}
            variant={book.bookid === selectedBookId ? "default" : "outline"}
            className="h-auto min-h-10 justify-start whitespace-normal py-2 text-left"
            onClick={() => onSelect(book.bookid)}
          >
            {book.name}
          </Button>
        ))}
      </div>
    </section>
  );
}

function ChapterPicker({
  bookName,
  chapters,
  currentChapter,
  open,
  onOpenChange,
  onSelect,
}: {
  bookName?: string;
  chapters: number[];
  currentChapter: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (chapter: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Capítulos de {bookName ?? "Bíblia"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
          {chapters.map((chapter) => (
            <Button
              key={chapter}
              variant={chapter === currentChapter ? "default" : "outline"}
              className="px-0"
              onClick={() => onSelect(chapter)}
            >
              {chapter}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Devotionals({ canManage }: { canManage: boolean }) {
  const list = useStore((s) => s.devotionals);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Devotional | null>(null);
  const [form, setForm] = useState({ title: "", verseRef: "", verseText: "", content: "" });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", verseRef: "", verseText: "", content: "" });
    setOpen(true);
  };
  const openEdit = (d: Devotional) => {
    setEditing(d);
    setForm({
      title: d.title,
      verseRef: d.verseRef ?? "",
      verseText: d.verseText ?? "",
      content: d.content,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    if (editing) {
      devApi.update(editing.id, {
        title: form.title.trim(),
        verseRef: form.verseRef.trim() || undefined,
        verseText: form.verseText.trim() || undefined,
        content: form.content.trim(),
      });
      toast.success("Devocional atualizado");
    } else {
      devApi.add(form);
      toast.success("Devocional publicado");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" /> Novo devocional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar devocional" : "Novo devocional"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex.: A graça que sustenta"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Referência bíblica (opcional)</Label>
                  <Input
                    value={form.verseRef}
                    onChange={(e) => setForm({ ...form, verseRef: e.target.value })}
                    placeholder="João 3:16 (NVI)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Texto do versículo (opcional)</Label>
                  <Textarea
                    rows={2}
                    value={form.verseText}
                    onChange={(e) => setForm({ ...form, verseText: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reflexão</Label>
                  <Textarea
                    rows={6}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={submit}>{editing ? "Salvar" : "Publicar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!list.length && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum devocional publicado ainda.
        </div>
      )}

      <div className="space-y-4">
        {list.map((d) => (
          <article key={d.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg">{d.title}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {d.authorName} •{" "}
                  {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </p>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      devApi.remove(d.id);
                      toast.success("Devocional removido");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            {d.verseRef && (
              <blockquote className="mt-3 border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
                {d.verseText && <span className="block">“{d.verseText}”</span>}
                <span className="not-italic font-medium text-foreground">{d.verseRef}</span>
              </blockquote>
            )}
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{d.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
