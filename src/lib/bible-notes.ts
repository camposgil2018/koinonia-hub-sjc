import { supabase } from "@/integrations/supabase/client";

export type BibleNote = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type NewBibleNote = {
  userId: string;
  content: string;
};

const NOTES_KEY = "bible_notes";

function isBibleNote(value: unknown): value is BibleNote {
  if (typeof value !== "object" || value === null) return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.content === "string" &&
    typeof note.created_at === "string" &&
    typeof note.updated_at === "string"
  );
}

async function getCurrentUserNotes(expectedUserId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.id !== expectedUserId) {
    throw new Error("Sessão inválida para salvar anotações.");
  }

  const savedNotes = data.user.user_metadata?.[NOTES_KEY];
  return Array.isArray(savedNotes) ? savedNotes.filter(isBibleNote) : [];
}

async function saveNotes(notes: BibleNote[]) {
  const { error } = await supabase.auth.updateUser({
    data: { [NOTES_KEY]: notes },
  });
  if (error) throw error;
}

export const bibleNotes = {
  async list(userId: string) {
    const notes = await getCurrentUserNotes(userId);
    return notes.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  async create(note: NewBibleNote) {
    const notes = await getCurrentUserNotes(note.userId);
    const now = new Date().toISOString();
    const saved: BibleNote = {
      id: crypto.randomUUID(),
      content: note.content,
      created_at: now,
      updated_at: now,
    };
    await saveNotes([saved, ...notes]);
    return saved;
  },

  async update(userId: string, id: string, content: string) {
    const notes = await getCurrentUserNotes(userId);
    const saved = notes.find((note) => note.id === id);
    if (!saved) throw new Error("Anotação não encontrada.");

    const updated = { ...saved, content, updated_at: new Date().toISOString() };
    await saveNotes(notes.map((note) => (note.id === id ? updated : note)));
    return updated;
  },

  async remove(userId: string, id: string) {
    const notes = await getCurrentUserNotes(userId);
    await saveNotes(notes.filter((note) => note.id !== id));
  },
};
