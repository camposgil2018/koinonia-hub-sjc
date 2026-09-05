import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type BibleNote = Database["public"]["Tables"]["bible_notes"]["Row"];

type NewBibleNote = {
  userId: string;
  content: string;
};

export const bibleNotes = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from("bible_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(note: NewBibleNote) {
    const { data, error } = await supabase
      .from("bible_notes")
      .insert({
        user_id: note.userId,
        content: note.content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, content: string) {
    const { data, error } = await supabase
      .from("bible_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("bible_notes").delete().eq("id", id);
    if (error) throw error;
  },
};
